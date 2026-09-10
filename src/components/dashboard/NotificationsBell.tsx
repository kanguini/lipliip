"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BadgeCheck, BookOpen, Camera, CheckCheck, ConciergeBell, UserCheck, type LucideIcon } from "lucide-react";
import { relativeTime, unreadBadge, type NotificationItem, type NotificationKind } from "@/lib/notifications";
import { markNotificationsReadAction } from "@/app/dashboard/notifications-actions";

const KIND: Record<NotificationKind, { icon: LucideIcon; tone: string }> = {
  RSVP: { icon: UserCheck, tone: "bg-joy-sage/40 text-emerald-900" },
  GUESTBOOK: { icon: BookOpen, tone: "bg-joy-lilac/50 text-brand-800" },
  REQUEST: { icon: ConciergeBell, tone: "bg-joy-sun/60 text-brand-800" },
  PHOTO: { icon: Camera, tone: "bg-joy-sky/50 text-sky-900" },
  ORDER: { icon: BadgeCheck, tone: "bg-brand-100 text-brand-700" },
};

/** Sino de notificações que abre uma janela flutuante (pop-up) com a atividade recente. */
export function NotificationsBell({ unread, items }: { unread: number; items: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const badge = unreadBadge(unread);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-brand-700 transition hover:bg-brand-100"
        aria-label={badge ? `Notificações: ${badge} por ler` : "Notificações"}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        {badge && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-joy-coral px-1 text-[0.6875rem] font-semibold leading-none text-white shadow-sm" aria-hidden>
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notificações"
          className="absolute right-0 z-40 mt-2 w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-3xl bg-white shadow-[0_16px_48px_rgba(84,27,56,0.18)] ring-1 ring-brand-100"
        >
          <div className="flex items-center justify-between gap-2 border-b border-brand-100 px-4 py-3">
            <p className="font-display text-lg text-brand-800">Notificações</p>
            {unread > 0 && (
              <form action={markNotificationsReadAction}>
                <button className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-50">
                  <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                  Marcar como lido
                </button>
              </form>
            )}
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-medium text-ink">Nada de novo por agora</p>
                <p className="mt-1 text-xs text-muted">As respostas, mensagens, pedidos e fotografias dos seus eventos aparecem aqui.</p>
              </div>
            ) : (
              <ul className="divide-y divide-brand-50">
                {items.map((n) => {
                  const k = KIND[n.kind];
                  return (
                    <li key={n.id}>
                      <Link href={n.href} onClick={() => setOpen(false)} className={`flex items-start gap-3 px-4 py-3 transition hover:bg-brand-50 ${n.unread ? "bg-brand-50/60" : ""}`}>
                        <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${k.tone}`}><k.icon className="h-4 w-4" strokeWidth={1.75} aria-hidden /></span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm ${n.unread ? "font-semibold text-ink" : "font-medium text-ink/90"}`}>{n.title}</p>
                          {n.detail && <p className="mt-0.5 truncate text-xs text-muted">{n.detail}</p>}
                          <p className="mt-0.5 text-[11px] text-muted">{n.eventTitle} · {relativeTime(n.at)}</p>
                        </div>
                        {n.unread && <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-joy-coral" aria-label="Não lida" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Link href="/dashboard/notifications" onClick={() => setOpen(false)} className="block border-t border-brand-100 px-4 py-3 text-center text-sm font-semibold text-brand-700 transition hover:bg-brand-50">
            Ver todas
          </Link>
        </div>
      )}
    </div>
  );
}
