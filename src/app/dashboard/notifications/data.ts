import { cache } from "react";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { accessibleEventWhere } from "@/lib/access";
import { NOTIFICATION_TAKE, NOTIFICATION_WINDOW_DAYS, buildNotifications, countUnread, type NotificationItem } from "@/lib/notifications";

/**
 * Atividade recente nos eventos do utilizador (últimos 14 dias), no máximo 20 linhas por fonte.
 * Partilhado pelo layout (crachá do sino) e pela página de notificações no mesmo pedido.
 */
export const loadNotifications = cache(async (user: Pick<User, "id" | "notifiedAt">): Promise<{ items: NotificationItem[]; unread: number }> => {
  const now = new Date();
  const since = new Date(now.getTime() - NOTIFICATION_WINDOW_DAYS * 86_400_000);
  const event = accessibleEventWhere(user.id);
  const take = NOTIFICATION_TAKE;
  const [rsvps, guestbook, requests, photos, orders] = await Promise.all([
    db.guest.findMany({
      where: { event, respondedAt: { gte: since }, suspendedAt: null },
      orderBy: { respondedAt: "desc" },
      take,
      select: { id: true, name: true, rsvpStatus: true, companions: true, respondedAt: true, eventId: true, event: { select: { title: true } } },
    }),
    db.guestbookEntry.findMany({
      where: { event, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, message: true, createdAt: true, eventId: true, guest: { select: { name: true } }, event: { select: { title: true } } },
    }),
    db.guestRequest.findMany({
      where: { event, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, kind: true, text: true, createdAt: true, eventId: true, guest: { select: { name: true } }, event: { select: { title: true } } },
    }),
    db.eventPhoto.findMany({
      where: { event, kind: "LIVE", hiddenAt: null, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, caption: true, createdAt: true, eventId: true, guest: { select: { name: true } }, event: { select: { title: true } } },
    }),
    db.order.findMany({
      where: { event, reviewedAt: { gte: since } },
      orderBy: { reviewedAt: "desc" },
      take,
      select: { id: true, status: true, reviewedAt: true, eventId: true, event: { select: { title: true } } },
    }),
  ]);
  const items = buildNotifications({ rsvps, guestbook, requests, photos, orders }, { readAt: user.notifiedAt, now, since });
  return { items, unread: countUnread(items) };
});
