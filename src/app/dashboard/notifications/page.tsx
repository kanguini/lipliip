import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { relativeTime, type NotificationKind } from "@/lib/notifications";
import { EmptyState, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/dashboard/SubmitButton";
import { markNotificationsReadAction } from "../notifications-actions";
import { loadNotifications } from "./data";
import { BadgeCheck, BookOpen, Camera, CheckCheck, ConciergeBell, UserCheck, type LucideIcon } from "lucide-react";

export const metadata = { title: "Notificações" };

const KIND: Record<NotificationKind, { icon: LucideIcon; tone: string }> = {
  RSVP: { icon: UserCheck, tone: "bg-joy-sage/40 text-emerald-900" },
  GUESTBOOK: { icon: BookOpen, tone: "bg-joy-lilac/50 text-brand-800" },
  REQUEST: { icon: ConciergeBell, tone: "bg-joy-sun/60 text-brand-800" },
  PHOTO: { icon: Camera, tone: "bg-joy-sky/50 text-sky-900" },
  ORDER: { icon: BadgeCheck, tone: "bg-brand-100 text-brand-700" },
};

export default async function NotificationsPage() {
  const user = await requireUser();
  const { items, unread } = await loadNotifications(user);
  // Ao abrir a página, tudo o que estava por ler fica lido (a lista desta visita mantém as marcas).
  if (unread > 0) await db.user.update({ where: { id: user.id }, data: { notifiedAt: new Date() } });
  const now = new Date();

  return (
    <>
      <p className="eyebrow">Atividade</p>
      <PageHeader
        title="Notificações"
        subtitle={unread > 0 ? `${unread} novidade${unread === 1 ? "" : "s"} desde a última visita. Mostramos os últimos 14 dias.` : "Está tudo em dia. Mostramos os últimos 14 dias."}
        actions={
          unread > 0 ? (
            <form action={markNotificationsReadAction}>
              <SubmitButton className="btn-secondary" pendingText="A marcar…"><CheckCheck className="h-4 w-4" aria-hidden />Marcar tudo como lido</SubmitButton>
            </form>
          ) : undefined
        }
      />
      {items.length === 0 ? (
        <EmptyState title="Nada de novo por agora" description="Quando os convidados responderem, deixarem mensagens, fizerem pedidos ou partilharem fotografias, aparece aqui." action={<Link href="/dashboard" className="btn-primary">Os meus eventos</Link>} />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const k = KIND[n.kind];
            return (
              <li key={n.id}>
                <Link href={n.href} className={`flex items-start gap-4 rounded-3xl bg-white p-4 shadow-[0_2px_16px_rgba(84,27,56,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(84,27,56,0.12)] ${n.unread ? "ring-2 ring-brand-100" : ""}`}>
                  <span className={`icon-circle ${k.tone}`}><k.icon className="h-5 w-5" strokeWidth={1.75} aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${n.unread ? "font-semibold text-ink" : "font-medium text-ink/90"}`}>{n.title}</p>
                    {n.detail && <p className="mt-0.5 text-sm text-muted">{n.detail}</p>}
                    <p className="mt-1 text-xs text-[#a1939c]">{n.eventTitle} · {relativeTime(n.at, now)}</p>
                  </div>
                  {n.unread && <span className="mt-2 h-2.5 w-2.5 flex-none rounded-full bg-joy-coral" aria-label="Não lida" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
