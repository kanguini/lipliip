"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { generateDeviceToken, generateOtpCode, hashOtp, verifyOtpHash } from "@/lib/tokens";
import { getSmsProvider, otpMessage } from "@/lib/sms";
import { DEVICE_COOKIE_DAYS, deviceCookieName, getGuestByToken, logAccess, requestMeta, requireGuestAccess } from "@/lib/guest-access";
import { rateLimit } from "@/lib/rate-limit";

const OTP_TTL_MIN = 10;
const OTP_MAX_PER_WINDOW = 3;
const OTP_MAX_ATTEMPTS = 5;

export type ActionResult = { ok: boolean; error?: string; devCode?: string };

function fail(error: string): ActionResult {
  return { ok: false, error };
}

export async function requestOtpAction(token: string): Promise<ActionResult> {
  const guest = await getGuestByToken(token);
  if (!guest) return fail("Convite inválido.");
  const meta = await requestMeta();
  if (!rateLimit(`otp:${meta.ip ?? "?"}`, 10, 15 * 60_000).ok) return fail("Demasiados pedidos a partir desta ligação. Tente mais tarde.");

  const windowStart = new Date(Date.now() - OTP_TTL_MIN * 60_000);
  const recent = await db.otpCode.count({ where: { guestId: guest.id, createdAt: { gte: windowStart } } });
  if (recent >= OTP_MAX_PER_WINDOW) {
    await logAccess(guest.id, "OTP_RATE_LIMIT");
    return fail(`Já foram enviados ${OTP_MAX_PER_WINDOW} códigos. Aguarde alguns minutos e tente de novo.`);
  }

  const code = generateOtpCode();
  await db.otpCode.create({
    data: { guestId: guest.id, codeHash: hashOtp(code, guest.id), expiresAt: new Date(Date.now() + OTP_TTL_MIN * 60_000) },
  });

  const result = await getSmsProvider().send(guest.phone, otpMessage(code, guest.event.title));
  if (!result.ok) {
    console.error("Falha no envio de SMS:", result.error);
    return fail("Não foi possível enviar o SMS. Tente novamente mais tarde.");
  }
  await logAccess(guest.id, "OTP_SENT");

  const showDev = process.env.NODE_ENV !== "production" && process.env.SHOW_OTP_IN_DEV === "true" && process.env.SMS_PROVIDER !== "twilio";
  return { ok: true, devCode: showDev ? code : undefined };
}

export async function verifyOtpAction(token: string, code: string): Promise<ActionResult> {
  const guest = await getGuestByToken(token);
  if (!guest) return fail("Convite inválido.");
  const clean = code.replace(/\D/g, "");
  if (clean.length !== 6) return fail("O código tem 6 dígitos.");

  const otp = await db.otpCode.findFirst({
    where: { guestId: guest.id, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return fail("Código expirado. Peça um novo código.");
  if (otp.attempts >= OTP_MAX_ATTEMPTS) return fail("Demasiadas tentativas. Peça um novo código.");

  if (!verifyOtpHash(clean, guest.id, otp.codeHash)) {
    await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    await logAccess(guest.id, "OTP_FAIL");
    return fail("Código incorreto.");
  }

  const deviceCount = await db.guestDevice.count({ where: { guestId: guest.id } });
  if (deviceCount >= guest.event.maxDevicesPerGuest) {
    await logAccess(guest.id, "DEVICE_LIMIT");
    return fail("Este convite já foi aberto no número máximo de dispositivos permitido. Contacte os anfitriões.");
  }

  const meta = await requestMeta();
  const deviceToken = generateDeviceToken();
  await db.$transaction([
    db.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
    db.guestDevice.create({ data: { guestId: guest.id, deviceToken, userAgent: meta.userAgent } }),
    db.guest.update({ where: { id: guest.id }, data: { verifiedAt: guest.verifiedAt ?? new Date() } }),
  ]);
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
  if (event.rsvpDeadline && event.rsvpDeadline < new Date()) return fail("O prazo para confirmar presença já terminou.");

  const status = String(formData.get("status"));
  if (status !== "ACCEPTED" && status !== "DECLINED") return fail("Indique se vai ou não.");
  let companions = Number.parseInt(String(formData.get("companions") ?? "0"), 10) || 0;
  companions = Math.max(0, Math.min(companions, guest.maxCompanions));
  if (status === "DECLINED") companions = 0;

  await db.guest.update({
    where: { id: guest.id },
    data: {
      rsvpStatus: status,
      companions,
      companionNames: String(formData.get("companionNames") ?? "").trim().slice(0, 300) || null,
      dietaryNotes: String(formData.get("dietaryNotes") ?? "").trim().slice(0, 300) || null,
      rsvpMessage: String(formData.get("rsvpMessage") ?? "").trim().slice(0, 500) || null,
      songRequest: event.songRequestsEnabled ? String(formData.get("songRequest") ?? "").trim().slice(0, 120) || null : guest.songRequest,
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
  const gift = await db.giftItem.findFirst({ where: { id: giftId, eventId: event.id }, include: { reservations: true } });
  if (!gift) return fail("Presente não encontrado.");

  const note = String(formData.get("note") ?? "").trim().slice(0, 300) || null;
  if (gift.kind === "CASH") {
    const amount = Number.parseFloat(String(formData.get("amount") ?? "").replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) return fail("Indique um valor válido.");
    await db.giftReservation.upsert({
      where: { giftId_guestId: { giftId, guestId: guest.id } },
      create: { giftId, guestId: guest.id, amount, note },
      update: { amount, note },
    });
  } else {
    const already = gift.reservations.find((r) => r.guestId === guest.id);
    const reserved = gift.reservations.reduce((s, r) => s + r.quantity, 0) - (already?.quantity ?? 0);
    const wanted = Math.max(1, Number.parseInt(String(formData.get("quantity") ?? "1"), 10) || 1);
    if (reserved + wanted > gift.quantity) return fail("Este presente já foi reservado por outro convidado.");
    await db.giftReservation.upsert({
      where: { giftId_guestId: { giftId, guestId: guest.id } },
      create: { giftId, guestId: guest.id, quantity: wanted, note },
      update: { quantity: wanted, note },
    });
  }
  revalidatePath(`/c/${token}`);
  return { ok: true };
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
  const message = String(formData.get("message") ?? "").trim().slice(0, 600);
  if (message.length < 2) return fail("Escreva uma mensagem.");
  await db.guestbookEntry.create({ data: { eventId: event.id, guestId: guest.id, message } });
  revalidatePath(`/c/${token}`);
  return { ok: true };
}
