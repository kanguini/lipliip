import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { accessibleEventWhere } from "@/lib/access";
import { EVENT_TYPES, type EventType } from "@/lib/event-types";
import { formatEventDate } from "@/lib/format";
import { EmptyState, FlashFromSearch, PageHeader } from "@/components/ui";
import { InvitationArt } from "@/components/templates/InvitationArt";
import { formatTime } from "@/lib/format";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const events = await db.event.findMany({
    where: accessibleEventWhere(user.id),
    orderBy: { date: "asc" },
    include: { _count: { select: { guests: true } }, guests: { select: { rsvpStatus: true, companions: true } } },
  });

  return (
    <>
      <p className="eyebrow">Cada momento, um laço</p>
      <PageHeader title="As suas celebrações" subtitle="Prepare os detalhes e acompanhe quem vai estar consigo." actions={<Link href="/dashboard/events/new" className="btn-primary">+ Criar evento</Link>} />
      <FlashFromSearch {...sp} />
      {events.length === 0 ? (
        <EmptyState
          title="Ainda não tem eventos"
          description="Crie o seu primeiro convite: escolha um template, preencha os dados e adicione os convidados."
          action={<Link href="/dashboard/events/new" className="btn-primary">Criar o primeiro evento</Link>}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {events.map((e) => {
            const accepted = e.guests.filter((g) => g.rsvpStatus === "ACCEPTED");
            const people = accepted.reduce((s, g) => s + 1 + g.companions, 0);
            const t = EVENT_TYPES[e.type as EventType];
            return (
              <Link key={e.id} href={`/dashboard/events/${e.id}`} className="grid overflow-hidden rounded-xl border border-brand-200/70 bg-white transition hover:shadow-md sm:grid-cols-[40%_60%]">
                <div className="hidden sm:block">
                  <InvitationArt templateId={e.templateId} kicker={t?.label ?? "Evento"} names={e.hostNames} dateLabel={formatEventDate(e.date, false, e.timezone)} placeLabel={e.venueName} coverImageUrl={e.coverImageUrl} small className="h-full rounded-none" style={{ aspectRatio: "3 / 5" }} />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[0.65rem] uppercase tracking-[0.1em] text-brand-500">{t?.label}</span>
                    <span className="text-[0.65rem] text-[#a1939c]">{e._count.guests} convites</span>
                  </div>
                  <p className="font-display mt-4 text-2xl leading-snug">{e.title}</p>
                  <p className="mt-3 text-xs text-[#8d7986]">📅 {formatEventDate(e.date, true, e.timezone)} · {formatTime(e.date, e.timezone)}</p>
                  <p className="mt-1 text-xs text-[#8d7986]">📍 {e.venueName}</p>
                  <div className="mt-5 flex gap-6 border-t border-brand-200/70 pt-4 text-[0.6875rem] text-[#96828f]">
                    <span><strong className="font-display block text-xl text-[#654354]">{accepted.length}</strong>confirmados</span>
                    <span><strong className="font-display block text-xl text-[#654354]">{people}</strong>presenças</span>
                  </div>
                  <span className="btn-secondary mt-4 w-full">Gerir evento →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
