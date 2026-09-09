import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { requireUser } from "./auth";

export type EventRole = "OWNER" | "EDITOR" | "STAFF";

/** Filtro Prisma: eventos a que o utilizador tem acesso (dono ou membro). */
export function accessibleEventWhere(userId: string): Prisma.EventWhereInput {
  return { OR: [{ ownerId: userId }, { members: { some: { userId } } }] };
}

export async function roleFor(userId: string, event: { ownerId: string; id: string }): Promise<EventRole | null> {
  if (event.ownerId === userId) return "OWNER";
  const m = await db.eventMember.findUnique({ where: { eventId_userId: { eventId: event.id, userId } } });
  return m ? (m.role as EventRole) : null;
}

/**
 * Garante acesso ao evento. Por omissão exige OWNER ou EDITOR; passe { allowStaff: true } nas páginas de check-in
 * e { ownerOnly: true } para eliminar o evento ou gerir a equipa.
 */
export async function requireEventAccess(eventId: string, opts: { allowStaff?: boolean; ownerOnly?: boolean } = {}) {
  const user = await requireUser();
  const event = await db.event.findFirst({ where: { id: eventId, ...accessibleEventWhere(user.id) } });
  if (!event) redirect("/dashboard");
  const role = (await roleFor(user.id, event)) ?? "STAFF";
  if (opts.ownerOnly && role !== "OWNER") redirect(`/dashboard/events/${eventId}?error=${encodeURIComponent("Só o dono do evento pode fazer isso.")}`);
  if (!opts.allowStaff && role === "STAFF") redirect(`/dashboard/events/${eventId}/checkin`);
  return { user, event, role };
}
