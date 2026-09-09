"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireEventAccess } from "@/lib/access";
import { flash, str, bool } from "@/lib/form";
import { rateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/guest-access";
import {
  RECEPTION_COOKIE_DAYS,
  generateReceptionPin,
  generateReceptionToken,
  hashReceptionPin,
  performCheckin,
  receptionCookieName,
  receptionCookieValue,
  verifyReceptionPin,
} from "@/lib/checkin";
import { getReceptionEvent, requireReceptionAccess } from "@/lib/reception";

/**
 * Ferramentas do dia do evento: link de receção sem conta (link + PIN), check-in a partir dessa página
 * e pedidos dos convidados (painel e receção).
 */

// ---------- Link de receção (organizador) ----------

export async function createReceptionLinkAction(eventId: string) {
  const { event } = await requireEventAccess(eventId);
  const path = `/dashboard/events/${eventId}/checkin`;
  const pin = generateReceptionPin();
  const token = generateReceptionToken();
  // Repete se, por azar, o token colidir com outro já existente.
  for (let attempt = 0; ; attempt++) {
    try {
      await db.event.update({ where: { id: eventId }, data: { checkinToken: attempt === 0 ? token : generateReceptionToken(), checkinPin: hashReceptionPin(pin) } });
      break;
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002" || attempt >= 4) throw e;
    }
  }
  if (event.checkinToken) revalidatePath(`/r/${event.checkinToken}`);
  revalidatePath(path);
  flash(`${path}?pin=${pin}`, "ok", `Link de receção ${event.checkinToken ? "renovado" : "criado"}. PIN: ${pin}. Guarde-o: não voltará a ser mostrado.`);
}

export async function revokeReceptionLinkAction(eventId: string) {
  const { event } = await requireEventAccess(eventId);
  const path = `/dashboard/events/${eventId}/checkin`;
  await db.event.update({ where: { id: eventId }, data: { checkinToken: null, checkinPin: null } });
  if (event.checkinToken) revalidatePath(`/r/${event.checkinToken}`);
  revalidatePath(path);
  flash(path, "ok", "Link de receção revogado. Quem o tinha deixa de conseguir entrar.");
}

// ---------- Página de receção (sem conta) ----------

const PIN_MAX_ATTEMPTS = 10;
const PIN_WINDOW_MS = 15 * 60_000;

export async function receptionPinAction(token: string, fd: FormData) {
  const path = `/r/${encodeURIComponent(token)}`;
  const event = await getReceptionEvent(token);
  if (!event) flash(path, "error", "Este link de receção já não é válido.");
  const meta = await requestMeta();
  if (!rateLimit(`reception-pin:${meta.ip ?? "?"}:${token}`, PIN_MAX_ATTEMPTS, PIN_WINDOW_MS).ok) flash(path, "error", "Demasiadas tentativas. Aguarde 15 minutos e tente de novo.");
  // Limite também por link (independente do IP): 30 tentativas por 15 minutos contra 10 000 PINs possíveis.
  if (!rateLimit(`reception-pin-link:${token}`, 30, PIN_WINDOW_MS).ok) flash(path, "error", "Demasiadas tentativas neste link. Aguarde 15 minutos e tente de novo.");
  const pin = str(fd, "pin", 8).replace(/\D/g, "");
  if (pin.length !== 4 || !verifyReceptionPin(pin, event.checkinPin!)) flash(path, "error", "PIN incorreto.");
  const store = await cookies();
  store.set(receptionCookieName(event.id), receptionCookieValue(event.checkinPin!, token), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: RECEPTION_COOKIE_DAYS * 86_400,
    path,
  });
  flash(path, "ok", `Bem-vindo(a) à receção de ${event.title}.`);
}

export async function receptionLogoutAction(token: string) {
  const path = `/r/${encodeURIComponent(token)}`;
  const event = await getReceptionEvent(token);
  if (event) {
    const store = await cookies();
    store.set(receptionCookieName(event.id), "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 0, path });
  }
  flash(path, "ok", "Sessão terminada.");
}

async function receptionEventOrFlash(token: string, path: string) {
  try {
    return await requireReceptionAccess(token);
  } catch (e) {
    flash(path, "error", (e as Error).message);
  }
}

function receptionPath(token: string, q?: string | null) {
  const base = `/r/${encodeURIComponent(token)}`;
  return q ? `${base}?q=${encodeURIComponent(q)}` : base;
}

export async function receptionCheckinAction(token: string, fd: FormData) {
  const path = receptionPath(token);
  const event = await receptionEventOrFlash(token, path);
  if (!rateLimit(`reception-checkin:${event.id}`, 600, 10 * 60_000).ok) flash(path, "error", "Demasiadas operações. Aguarde um momento.");
  const result = await performCheckin(event.id, str(fd, "code", 20), event.timezone);
  flash(path, result.ok ? "ok" : "error", result.message);
}

/** Botão "Entrou" / "Anular" na lista da receção. Usa a mesma lógica do código (suspensos não entram). */
export async function receptionToggleCheckinAction(token: string, guestId: string, returnQuery: string | null, _fd?: FormData) {
  const path = receptionPath(token, returnQuery);
  const event = await receptionEventOrFlash(token, path);
  const guest = await db.guest.findFirst({ where: { id: guestId, eventId: event.id }, select: { id: true, name: true, checkinCode: true, checkedInAt: true } });
  if (!guest) flash(path, "error", "Convidado não encontrado.");
  if (guest.checkedInAt) {
    await db.guest.updateMany({ where: { id: guest.id, eventId: event.id }, data: { checkedInAt: null } });
    flash(path, "ok", `Entrada de ${guest.name} anulada.`);
  }
  const result = await performCheckin(event.id, guest.checkinCode, event.timezone);
  flash(path, result.ok ? "ok" : "error", result.message);
}

export async function receptionRequestDoneAction(token: string, requestId: string) {
  const path = receptionPath(token);
  const event = await receptionEventOrFlash(token, path);
  await db.guestRequest.updateMany({ where: { id: requestId, eventId: event.id, status: "NEW" }, data: { status: "DONE", doneAt: new Date() } });
  revalidatePath(path);
  flash(path, "ok", "Pedido marcado como feito.");
}

// ---------- Pedidos dos convidados (painel) ----------

export async function toggleRequestStatusAction(eventId: string, requestId: string) {
  await requireEventAccess(eventId, { allowStaff: true });
  const path = `/dashboard/events/${eventId}/requests`;
  const request = await db.guestRequest.findFirst({ where: { id: requestId, eventId }, select: { id: true, status: true } });
  if (!request) flash(path, "error", "Pedido não encontrado.");
  const done = request.status !== "DONE";
  await db.guestRequest.update({ where: { id: request.id }, data: { status: done ? "DONE" : "NEW", doneAt: done ? new Date() : null } });
  revalidatePath(path);
}

export async function setRequestsEnabledAction(eventId: string, fd: FormData) {
  await requireEventAccess(eventId);
  const path = `/dashboard/events/${eventId}/requests`;
  const enabled = bool(fd, "requestsEnabled");
  await db.event.update({ where: { id: eventId }, data: { requestsEnabled: enabled } });
  revalidatePath(path);
  flash(path, "ok", enabled ? "Pedidos ativados: os convidados já podem pedir a partir do convite." : "Pedidos desativados: o painel deixa de aparecer no convite.");
}
