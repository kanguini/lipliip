import { cache } from "react";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { requireUser } from "./auth";

export type EventRole = "OWNER" | "EDITOR" | "STAFF";

/** Filtro Prisma: eventos a que o utilizador tem algum acesso (dono ou qualquer membro, incluindo receção). */
export function accessibleEventWhere(userId: string): Prisma.EventWhereInput {
  return { OR: [{ ownerId: userId }, { members: { some: { userId } } }] };
}

/** Filtro Prisma: eventos que o utilizador pode EDITAR (dono ou editor). A receção fica de fora. */
export function editableEventWhere(userId: string): Prisma.EventWhereInput {
  return { OR: [{ ownerId: userId }, { members: { some: { userId, role: "EDITOR" } } }] };
}

export function resolveRole(userId: string, event: { ownerId: string }, membership: { role: string } | null): EventRole | null {
  if (event.ownerId === userId) return "OWNER";
  return membership ? (membership.role as EventRole) : null;
}

export async function roleFor(userId: string, event: { ownerId: string; id: string }): Promise<EventRole | null> {
  if (event.ownerId === userId) return "OWNER";
  const m = await db.eventMember.findUnique({ where: { eventId_userId: { eventId: event.id, userId } } });
  return resolveRole(userId, event, m);
}

/** Carrega evento + papel uma única vez por pedido (layout e página partilham o resultado). */
const loadEventWithRole = cache(async (userId: string, eventId: string) => {
  const event = await db.event.findFirst({ where: { id: eventId, ...accessibleEventWhere(userId) } });
  if (!event) return null;
  const role = (await roleFor(userId, event)) ?? "STAFF";
  return { event, role };
});

/**
 * Garante acesso ao evento. Por omissão exige OWNER ou EDITOR; passe { allowStaff: true } nas páginas de check-in
 * e { ownerOnly: true } para eliminar o evento ou gerir a equipa.
 */
export async function requireEventAccess(eventId: string, opts: { allowStaff?: boolean; ownerOnly?: boolean } = {}) {
  const user = await requireUser();
  const loaded = await loadEventWithRole(user.id, eventId);
  if (!loaded) redirect("/dashboard");
  const { event, role } = loaded;
  if (opts.ownerOnly && role !== "OWNER") redirect(`/dashboard/events/${eventId}?error=${encodeURIComponent("Só o dono do evento pode fazer isso.")}`);
  if (!opts.allowStaff && role === "STAFF") redirect(`/dashboard/events/${eventId}/checkin`);
  return { user, event, role };
}
