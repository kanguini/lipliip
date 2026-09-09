"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { generateDeviceToken, generateOtpCode, hashOtp, sha256, verifyOtpHash } from "@/lib/tokens";
import { getSmsProvider, otpMessage } from "@/lib/sms";
import { DEVICE_COOKIE_DAYS, deviceCookieName, getGuestByToken, logAccess, requestMeta, requireGuestAccess } from "@/lib/guest-access";
import { rateLimit } from "@/lib/rate-limit";
import { pickDeviceSlot } from "@/lib/device-slots";
import { calendarDaysUntil } from "@/lib/timezone";
import { parseMoney } from "@/lib/form";

const OTP_TTL_MIN = 10;
const OTP_MAX_PER_WINDOW = 3;
const OTP_MAX_ATTEMPTS = 5;

export type ActionResult = { ok: boolean; error?: string; devCode?: string };

function fail(error: string): ActionResult {
  return { ok: false, error };
}

function clean(s: FormDataEntryValue | null, max: number) {
  return String(s ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max);
}

export async function requestOtpAction(token: string): Promise<ActionResult> {
  const guest = await getGuestByToken(token);
  if (!guest) return fail("Convite inválido.");
  if (guest.suspendedAt) return fail("Este convite está suspenso. Contacte os anfitriões.");
  if (!guest.event.verificationRequired) return fail("Este convite não precisa de validação.");
  const meta = await requestMeta();
  // Limite por ligação e por evento, folgado o suficiente para operadoras móveis com IP partilhado.
  if (meta.ip && !rateLimit(`otp:${meta.ip}:${guest.eventId}`, 80, 15 * 60_000).ok) return fail("Demasiados pedidos a partir desta ligação. Tente mais tarde.");

  // Limite de dispositivos verificado ANTES de gastar um SMS.
  const devices = await db.guestDevice.count({ where: { guestId: guest.id } });
  if (devices >= guest.event.maxDevicesPerGuest) {
    // Ainda é possível validar: o lugar mais antigo será reutilizado. Só avisamos se o limite for 0 (não permitido).
    if (guest.event.maxDevicesPerGuest <= 0) {
      await logAccess(guest.id, "DEVICE_LIMIT");
      return fail("Este convite já foi aberto no número máximo de dispositivos permitido. Contacte os anfitriões.");
    }
  }

  const windowStart = new Date(Date.now() - OTP_TTL_MIN * 60_000);
  const recent = await db.otpCode.count({ where: { guestId: guest.id, createdAt: { gte: windowStart } } });
  if (recent >= OTP_MAX_PER_WINDOW) {
    await logAccess(guest.id, "OTP_RATE_LIMIT");
    return fail(`Já foram enviados ${OTP_MAX_PER_WINDOW} códigos. Aguarde alguns minutos e tente de novo.`);
  }

  const code = generateOtpCode();
  let result: { ok: boolean; error?: string };
  try {
    result = await getSmsProvider().send(guest.phone, otpMessage(code, guest.event.title));
  } catch (e) {
    result = { ok: false, error: (e as Error).message };
  }
  if (!result.ok) {
    console.error("Falha no envio de SMS:", result.error);
    return fail("Não foi possível enviar o SMS. Tente novamente dentro de instantes.");
  }
  // Só depois de enviado é que o código conta para o limite do convidado. Limpa códigos antigos.
  await db.$transaction([
    db.otpCode.deleteMany({ where: { guestId: guest.id, OR: [{ expiresAt: { lt: new Date() } }, { consumedAt: { not: null } }] } }),
    db.otpCode.create({ data: { guestId: guest.id, codeHash: hashOtp(code, guest.id), expiresAt: new Date(Date.now() + OTP_TTL_MIN * 60_000) } }),
  ]);
  await logAccess(guest.id, "OTP_SENT");

  const showDev = process.env.NODE_ENV !== "production" && process.env.SHOW_OTP_IN_DEV === "true" && process.env.SMS_PROVIDER !== "twilio";
  return { ok: true, devCode: showDev ? code : undefined };
}

export async function verifyOtpAction(token: string, code: string): Promise<ActionResult> {
  const guest = await getGuestByToken(token);
  if (!guest) return fail("Convite inválido.");
  if (guest.suspendedAt) return fail("Este convite está suspenso. Contacte os anfitriões.");
  if (!guest.event.verificationRequired) return fail("Este convite não precisa de validação.");
  const digits = code.replace(/\D/g, "");
  if (digits.length !== 6) return fail("O código tem 6 dígitos.");
  const meta = await requestMeta();
  if (!rateLimit(`otp-verify:${meta.ip ?? "?"}:${guest.id}`, 15, 10 * 60_000).ok) return fail("Demasiadas tentativas. Aguarde alguns minutos.");

  // Qualquer código ainda válido é aceite (o convidado pode ter recebido o SMS anterior depois de pedir outro).
  const candidates = await db.otpCode.findMany({
    where: { guestId: guest.id, consumedAt: null, expiresAt: { gt: new Date() }, attempts: { lt: OTP_MAX_ATTEMPTS } },
    orderBy: { createdAt: "desc" },
  });
  if (candidates.length === 0) return fail("Código expirado ou com demasiadas tentativas. Peça um novo código.");
  // Reserva uma tentativa em cada candidato (incremento condicional): só os códigos em que a reserva
  // foi conseguida contam, para que pedidos simultâneos não ultrapassem o limite de tentativas.
  const reserved = [];
  for (const c of candidates) {
    const { count } = await db.otpCode.updateMany({ where: { id: c.id, attempts: { lt: OTP_MAX_ATTEMPTS } }, data: { attempts: { increment: 1 } } });
    if (count === 1) reserved.push(c);
  }
  if (reserved.length === 0) return fail("Código expirado ou com demasiadas tentativas. Peça um novo código.");
  const match = reserved.find((c) => verifyOtpHash(digits, guest.id, c.codeHash));
  if (!match) {
    await logAccess(guest.id, "OTP_FAIL");
    return fail("Código incorreto.");
  }

  const deviceToken = generateDeviceToken();
  const max = guest.event.maxDevicesPerGuest;
  // Consumo do código e atribuição do lugar de dispositivo numa transação serializável (repetida em caso de conflito).
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const outcome = await db.$transaction(
        async (tx) => {
          const consumed = await tx.otpCode.updateMany({ where: { guestId: guest.id, consumedAt: null, expiresAt: { gt: new Date() } }, data: { consumedAt: new Date() } });
          if (consumed.count === 0) return "consumed";
          const devices = await tx.guestDevice.findMany({ where: { guestId: guest.id }, select: { id: true, lastSeenAt: true } });
          const slot = pickDeviceSlot(devices, max);
          if (slot.kind === "create") {
            await tx.guestDevice.create({ data: { guestId: guest.id, deviceToken: sha256(deviceToken), userAgent: meta.userAgent } });
          } else {
            await tx.guestDevice.update({ where: { id: slot.id }, data: { deviceToken: sha256(deviceToken), userAgent: meta.userAgent, lastSeenAt: new Date() } });
          }
          await tx.guest.update({ where: { id: guest.id }, data: { verifiedAt: guest.verifiedAt ?? new Date() } });
          return slot.kind;
        },
        { isolationLevel: "Serializable" },
      );
      if (outcome === "consumed") return fail("Este código já foi utilizado. Peça um novo código.");
      if (outcome === "replace") await logAccess(guest.id, "DEVICE_REPLACED");
      break;
    } catch (e) {
      const errCode = (e as { code?: string }).code;
      if (errCode !== "P2034" || attempt === 2) throw e;
    }
  }
  await logAccess(guest.id, "OTP_OK");

  const store = await cookies();
  store.set(deviceCookieName(guest.id), deviceToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: DEVICE_COOKIE_DAYS * 86_400,
    path: `/c/${token}`,
  });
  return { ok: true };
}

export async function rsvpAction(token: string, formData: FormData): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireGuestAccess(token);
  } catch (e) {
    return fail((e as Error).message);
  }
  const { guest, event } = ctx;
  // O prazo vale até ao fim do dia, no fuso do evento.
  if (event.rsvpDeadline && calendarDaysUntil(event.rsvpDeadline, event.timezone) < 0) return fail("O prazo para confirmar presença já terminou.");

  const status = String(formData.get("status"));
  if (status !== "ACCEPTED" && status !== "DECLINED") return fail("Indique se vai ou não.");
  let companions = Number.parseInt(String(formData.get("companions") ?? "0"), 10) || 0;
  companions = Math.max(0, Math.min(companions, guest.maxCompanions));
  const declined = status === "DECLINED";
  // Ao dizer que não vai, os detalhes anteriores ficam guardados: se mudar de ideias, não os perde.
  const keep = <T,>(key: string, current: T, max: number) => (declined || !formData.has(key) ? current : (clean(formData.get(key), max) || null) as T);

  await db.guest.update({
    where: { id: guest.id },
    data: {
      rsvpStatus: status,
      companions: declined ? 0 : companions,
      companionNames: keep("companionNames", guest.companionNames, 300),
      dietaryNotes: keep("dietaryNotes", guest.dietaryNotes, 300),
      songRequest: event.songRequestsEnabled ? keep("songRequest", guest.songRequest, 120) : guest.songRequest,
      rsvpMessage: clean(formData.get("rsvpMessage"), 500) || null,
      respondedAt: new Date(),
    },
  });
  revalidatePath(`/c/${token}`);
  return { ok: true };
}

export async function reserveGiftAction(token: string, giftId: string, formData: FormData): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireGuestAccess(token);
  } catch (e) {
    return fail((e as Error).message);
  }
  const { guest, event } = ctx;
  if (!event.giftsEnabled) return fail("Lista de presentes desativada.");
  const note = clean(formData.get("note"), 300) || null;
  const amountRaw = clean(formData.get("amount"), 20);
  const amount = parseMoney(amountRaw);
  const wanted = Math.max(1, Math.min(50, Number.parseInt(String(formData.get("quantity") ?? "1"), 10) || 1));

  // Transação serializável (com repetição) para dois convidados não reservarem a última unidade ao mesmo tempo.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await db.$transaction(
        async (tx) => {
          const fresh = await tx.guest.findUnique({ where: { id: guest.id }, select: { suspendedAt: true } });
          if (!fresh || fresh.suspendedAt) return "Este convite está suspenso.";
          const gift = await tx.giftItem.findFirst({ where: { id: giftId, eventId: event.id }, include: { reservations: true } });
          if (!gift) return "Presente não encontrado.";
          if (gift.kind === "CASH") {
            if (amount == null || amount <= 0) return "Indique um valor válido (ex.: 50 ou 25,50).";
            await tx.giftReservation.upsert({
              where: { giftId_guestId: { giftId, guestId: guest.id } },
              create: { giftId, guestId: guest.id, amount, note },
              update: { amount, note },
            });
            return null;
          }
          const already = gift.reservations.find((r) => r.guestId === guest.id);
          const reservedByOthers = gift.reservations.reduce((s, r) => s + r.quantity, 0) - (already?.quantity ?? 0);
          if (reservedByOthers + wanted > gift.quantity) return "Este presente já foi reservado por outro convidado.";
          await tx.giftReservation.upsert({
            where: { giftId_guestId: { giftId, guestId: guest.id } },
            create: { giftId, guestId: guest.id, quantity: wanted, note },
            update: { quantity: wanted, note },
          });
          return null;
        },
        { isolationLevel: "Serializable" },
      );
      revalidatePath(`/c/${token}`);
      if (result) return fail(result);
      return { ok: true };
    } catch (e) {
      const errCode = (e as { code?: string }).code;
      if (errCode !== "P2034" && errCode !== "P2002") throw e;
    }
  }
  return fail("Muita gente a reservar ao mesmo tempo. Tente de novo.");
}

export async function cancelReservationAction(token: string, giftId: string): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireGuestAccess(token);
  } catch (e) {
    return fail((e as Error).message);
  }
  await db.giftReservation.deleteMany({ where: { giftId, guestId: ctx.guest.id } });
  revalidatePath(`/c/${token}`);
  return { ok: true };
}

export async function guestbookAction(token: string, formData: FormData): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireGuestAccess(token);
  } catch (e) {
    return fail((e as Error).message);
  }
  const { guest, event } = ctx;
  if (!event.guestbookEnabled) return fail("Livro de mensagens desativado.");
  if (!rateLimit(`guestbook:${guest.id}`, 5, 10 * 60_000).ok) return fail("Já deixou várias mensagens. Obrigado! Tente mais tarde.");
  const message = clean(formData.get("message"), 600);
  if (message.length < 2) return fail("Escreva uma mensagem.");
  await db.guestbookEntry.create({ data: { eventId: event.id, guestId: guest.id, message } });
  revalidatePath(`/c/${token}`);
  return { ok: true };
}
