import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { accessibleEventWhere } from "@/lib/access";
import { EVENT_TYPES, type EventType } from "@/lib/event-types";
import { formatEventDate } from "@/lib/format";
import { EmptyState, FlashFromSearch, PageHeader } from "@/components/ui";
import { InvitationArt } from "@/components/templates/InvitationArt";
import { getCustomTemplates } from "@/lib/custom-templates";
import { formatTime } from "@/lib/format";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [eventsRaw, counts] = await Promise.all([
    db.event.findMany({ where: accessibleEventWhere(user.id), orderBy: { date: "asc" }, include: { _count: { select: { guests: true } } } }),
    db.guest.groupBy({ by: ["eventId", "rsvpStatus"], where: { event: accessibleEventWhere(user.id), suspendedAt: null }, _count: { _all: true }, _sum: { companions: true } }),
  ]);
  const events = eventsRaw.map((e) => {
    const acc = counts.find((c) => c.eventId === e.id && c.rsvpStatus === "ACCEPTED");
    return { ...e, acceptedCount: acc?._count._all ?? 0, people: (acc?._count._all ?? 0) + (acc?._sum.companions ?? 0) };
  });
  // Metas dos templates personalizados usados pelos eventos (os do catálogo fixo resolvem-se sozinhos).
  const customById = new Map((await getCustomTemplates()).map((t) => [t.id, t]));

  return (
    <>
      <p className="eyebrow">Eventos</p>
      <PageHeader title="As suas celebrações" subtitle="Prepare os detalhes e acompanhe quem vai estar consigo." actions={<Link href="/dashboard/events/new" className="btn-primary">Novo evento</Link>} />
      <FlashFromSearch {...sp} />
      {events.length === 0 ? (
        <EmptyState
          title="A próxima história começa consigo"
          description="Ainda não criou nenhum evento. Escolha um modelo em Convites digitais e crie o convite em três passos."
          action={<Link href="/dashboard/invites" className="btn-primary">Escolher um modelo</Link>}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {events.map((e) => {
            const t = EVENT_TYPES[e.type as EventType];
            return (
              <Link key={e.id} href={`/dashboard/events/${e.id}`} className="grid overflow-hidden rounded-3xl bg-white shadow-[0_2px_24px_rgba(84,27,56,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(84,27,56,0.14)] sm:grid-cols-[40%_60%]">
                <div className="hidden sm:block">
                  <InvitationArt templateId={e.templateId} template={customById.get(e.templateId)} kicker={t?.label ?? "Evento"} names={e.hostNames} dateLabel={formatEventDate(e.date, false, e.timezone)} placeLabel={e.venueName} coverImageUrl={e.coverImageUrl} small className="h-full rounded-none" style={{ aspectRatio: "3 / 5" }} />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[0.65rem] uppercase tracking-[0.1em] text-brand-500">{t?.label}</span>
                    <span className="text-[0.65rem] text-[#a1939c]">{e._count.guests} convites</span>
                  </div>
                  <p className="font-display mt-4 text-2xl leading-snug">{e.title}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-[#8d7986]"><CalendarDays className="h-3.5 w-3.5 text-brand-500" aria-hidden />{formatEventDate(e.date, true, e.timezone)} · {formatTime(e.date, e.timezone)}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[#8d7986]"><MapPin className="h-3.5 w-3.5 text-brand-500" aria-hidden />{e.venueName}</p>
                  <div className="mt-5 flex gap-6 border-t border-brand-100 pt-4 text-[0.6875rem] text-[#96828f]">
                    <span><strong className="font-display block text-xl text-[#654354]">{e.acceptedCount}</strong>confirmados</span>
                    <span><strong className="font-display block text-xl text-[#654354]">{e.people}</strong>presenças</span>
                  </div>
                  <span className="btn-secondary mt-4 w-full">Gerir evento <ArrowRight className="h-4 w-4" aria-hidden /></span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
