/**
 * Feed de notificações do painel: junta atividade recente de várias fontes (RSVP, mensagens, pedidos,
 * fotografias, pagamentos) numa única lista ordenada. Só helpers puros aqui — as consultas ficam na página.
 */

export const NOTIFICATION_WINDOW_DAYS = 14;
export const NOTIFICATION_TAKE = 20;

export type NotificationKind = "RSVP" | "GUESTBOOK" | "REQUEST" | "PHOTO" | "ORDER";

export type NotificationItem = {
  /** Identificador estável (tipo + id da linha de origem). */
  id: string;
  kind: NotificationKind;
  at: Date;
  eventId: string;
  eventTitle: string;
  title: string;
  detail?: string;
  href: string;
  unread: boolean;
};

export type NotificationSources = {
  rsvps: { id: string; name: string; rsvpStatus: string; companions: number; respondedAt: Date | null; eventId: string; event: { title: string } }[];
  guestbook: { id: string; message: string; createdAt: Date; eventId: string; guest: { name: string }; event: { title: string } }[];
  requests: { id: string; kind: string; text: string; createdAt: Date; eventId: string; guest: { name: string }; event: { title: string } }[];
  photos: { id: string; caption: string | null; createdAt: Date; eventId: string; guest: { name: string } | null; event: { title: string } }[];
  orders: { id: string; status: string; reviewedAt: Date | null; eventId: string; event: { title: string } }[];
};

const REQUEST_KIND: Record<string, string> = { FOOD: "comida", DRINK: "bebida", MUSIC: "música", OTHER: "outro" };

function short(text: string, max = 90): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/**
 * Junta e ordena (mais recente primeiro) as várias fontes; marca como não lidas as posteriores a `readAt`.
 * `since` exclui itens mais antigos do que a janela (por omissão 14 dias).
 */
export function buildNotifications(sources: NotificationSources, opts: { readAt: Date | null; now?: Date; since?: Date; limit?: number }): NotificationItem[] {
  const now = opts.now ?? new Date();
  const since = opts.since ?? new Date(now.getTime() - NOTIFICATION_WINDOW_DAYS * 86_400_000);
  const readAt = opts.readAt;
  const items: NotificationItem[] = [];
  const push = (item: Omit<NotificationItem, "unread">) => {
    if (item.at < since || item.at > new Date(now.getTime() + 60_000)) return;
    items.push({ ...item, unread: !readAt || item.at > readAt });
  };

  for (const g of sources.rsvps) {
    if (!g.respondedAt) continue;
    const base = `/dashboard/events/${g.eventId}`;
    const accepted = g.rsvpStatus === "ACCEPTED";
    push({
      id: `rsvp:${g.id}:${g.respondedAt.getTime()}`,
      kind: "RSVP",
      at: g.respondedAt,
      eventId: g.eventId,
      eventTitle: g.event.title,
      title: accepted ? `${g.name} confirmou presença` : g.rsvpStatus === "DECLINED" ? `${g.name} não vai poder ir` : `${g.name} respondeu ao convite`,
      detail: accepted && g.companions > 0 ? `Leva ${g.companions} acompanhante${g.companions === 1 ? "" : "s"}.` : undefined,
      href: `${base}/guests/${g.id}`,
    });
  }
  for (const e of sources.guestbook) {
    push({
      id: `guestbook:${e.id}`,
      kind: "GUESTBOOK",
      at: e.createdAt,
      eventId: e.eventId,
      eventTitle: e.event.title,
      title: `${e.guest.name} deixou uma mensagem`,
      detail: short(e.message),
      href: `/dashboard/events/${e.eventId}/guestbook`,
    });
  }
  for (const r of sources.requests) {
    push({
      id: `request:${r.id}`,
      kind: "REQUEST",
      at: r.createdAt,
      eventId: r.eventId,
      eventTitle: r.event.title,
      title: `${r.guest.name} fez um pedido (${REQUEST_KIND[r.kind] ?? "outro"})`,
      detail: short(r.text),
      href: `/dashboard/events/${r.eventId}/requests`,
    });
  }
  for (const p of sources.photos) {
    push({
      id: `photo:${p.id}`,
      kind: "PHOTO",
      at: p.createdAt,
      eventId: p.eventId,
      eventTitle: p.event.title,
      title: p.guest ? `${p.guest.name} partilhou uma fotografia` : "Nova fotografia partilhada",
      detail: p.caption ? short(p.caption) : undefined,
      href: `/dashboard/events/${p.eventId}/photos`,
    });
  }
  for (const o of sources.orders) {
    if (!o.reviewedAt || o.status === "PENDING") continue;
    push({
      id: `order:${o.id}:${o.reviewedAt.getTime()}`,
      kind: "ORDER",
      at: o.reviewedAt,
      eventId: o.eventId,
      eventTitle: o.event.title,
      title: o.status === "APPROVED" ? "Pagamento aprovado: evento ativado" : "Pagamento não aprovado",
      detail: o.status === "APPROVED" ? "Já pode enviar os convites a todos os convidados." : "Veja o motivo e envie um novo comprovativo.",
      href: `/dashboard/events/${o.eventId}/activate`,
    });
  }

  items.sort((a, b) => b.at.getTime() - a.at.getTime() || a.id.localeCompare(b.id));
  return typeof opts.limit === "number" ? items.slice(0, opts.limit) : items;
}

export function countUnread(items: Pick<NotificationItem, "unread">[]): number {
  return items.reduce((n, i) => n + (i.unread ? 1 : 0), 0);
}

/** Texto do crachá do sino: "" quando não há nada, "9+" a partir de 10. */
export function unreadBadge(count: number): string {
  if (count <= 0) return "";
  return count > 9 ? "9+" : String(count);
}

/** Tempo relativo curto em pt-PT ("agora", "há 5 min", "há 3 h", "há 2 dias"). */
export function relativeTime(at: Date, now: Date = new Date()): string {
  const diff = Math.max(0, now.getTime() - at.getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ontem" : `há ${d} dias`;
}
