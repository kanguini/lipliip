import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { EVENT_TYPES, type EventType } from "@/lib/event-types";
import { formatEventDate } from "@/lib/format";
import { EmptyState, FlashFromSearch, PageHeader } from "@/components/ui";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const events = await db.event.findMany({
    where: { ownerId: user.id },
    orderBy: { date: "asc" },
    include: { _count: { select: { guests: true } }, guests: { select: { rsvpStatus: true, companions: true } } },
  });

  return (
    <>
      <PageHeader title="Os meus eventos" subtitle="Crie e acompanhe os seus convites." actions={<Link href="/dashboard/events/new" className="btn-primary">+ Novo evento</Link>} />
      <FlashFromSearch {...sp} />
      {events.length === 0 ? (
        <EmptyState
          title="Ainda não tem eventos"
          description="Crie o seu primeiro convite: escolha um template, preencha os dados e adicione os convidados."
          action={<Link href="/dashboard/events/new" className="btn-primary">Criar o primeiro evento</Link>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => {
            const accepted = e.guests.filter((g) => g.rsvpStatus === "ACCEPTED");
            const people = accepted.reduce((s, g) => s + 1 + g.companions, 0);
            const t = EVENT_TYPES[e.type as EventType];
            return (
              <Link key={e.id} href={`/dashboard/events/${e.id}`} className="card transition hover:shadow-md">
                <div className="flex items-start justify-between">
                  <span className="badge bg-stone-100 text-stone-700">{t?.emoji} {t?.label}</span>
                  <span className="text-xs text-stone-400">{e._count.guests} convidados</span>
                </div>
                <p className="mt-3 text-lg font-semibold">{e.title}</p>
                <p className="text-sm text-stone-500">{formatEventDate(e.date, true, e.timezone)}</p>
                <p className="mt-3 text-sm text-stone-600">
                  <strong className="text-emerald-700">{accepted.length}</strong> confirmados · <strong>{people}</strong> pessoas previstas
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
