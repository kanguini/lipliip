import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "./db";
import { isReceptionCookieValid, receptionCookieName } from "./checkin";

/**
 * Página de receção sem conta (/r/[token]): o evento é identificado pelo token do link e a sessão pelo
 * cookie definido depois do PIN correto. As server actions verificam sempre token + cookie; nunca só a URL.
 */

export const getReceptionEvent = cache(async (token: string) => {
  if (!token || token.length > 64 || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
  const event = await db.event.findUnique({ where: { checkinToken: token } });
  if (!event || !event.checkinPin) return null;
  return event;
});

export async function receptionAccess(token: string) {
  const event = await getReceptionEvent(token);
  if (!event) return { event: null, authorized: false as const };
  const store = await cookies();
  const cookie = store.get(receptionCookieName(event.id))?.value;
  return { event, authorized: isReceptionCookieValid(cookie, event.checkinPin, event.checkinToken) };
}

/** Usado pelas server actions da receção: lança se o link foi revogado ou o PIN ainda não foi introduzido. */
export async function requireReceptionAccess(token: string) {
  const { event, authorized } = await receptionAccess(token);
  if (!event) throw new Error("Este link de receção já não é válido.");
  if (!authorized) throw new Error("Introduza o PIN para continuar.");
  return event;
}
