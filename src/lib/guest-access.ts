import { cookies, headers } from "next/headers";
import type { Event, Guest } from "@prisma/client";
import { db } from "./db";

export const DEVICE_COOKIE_DAYS = 365;

export function deviceCookieName(guestId: string) {
  return `lp_g_${guestId}`;
}

export async function getGuestByToken(token: string) {
  if (!token || token.length > 64) return null;
  return db.guest.findUnique({ where: { token }, include: { event: true } });
}

/** Verdadeiro se o convidado pode ver o convite neste dispositivo. */
export async function isGuestAuthorized(guest: Guest, event: Event): Promise<boolean> {
  if (!event.verificationRequired) return true;
  const store = await cookies();
  const deviceToken = store.get(deviceCookieName(guest.id))?.value;
  if (!deviceToken) return false;
  const device = await db.guestDevice.findUnique({ where: { deviceToken } });
  if (!device || device.guestId !== guest.id) return false;
  // Atualiza "visto pela última vez" sem bloquear o pedido.
  db.guestDevice.update({ where: { id: device.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  return true;
}

/** Usado pelas server actions do convidado: garante token válido + dispositivo autorizado. */
export async function requireGuestAccess(token: string) {
  const guest = await getGuestByToken(token);
  if (!guest) throw new Error("Convite inválido.");
  if (!(await isGuestAuthorized(guest, guest.event))) throw new Error("Confirme o seu telemóvel para continuar.");
  return { guest, event: guest.event };
}

export async function requestMeta() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? undefined,
    userAgent: h.get("user-agent")?.slice(0, 250) ?? undefined,
  };
}

export async function logAccess(guestId: string, outcome: string) {
  const meta = await requestMeta();
  await db.accessLog.create({ data: { guestId, outcome, ip: meta.ip, userAgent: meta.userAgent } });
}
