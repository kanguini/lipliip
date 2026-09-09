import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { accessibleEventWhere, editableEventWhere } from "@/lib/access";
import { formatEventDate } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { EmptyState, PageHeader, RsvpBadge } from "@/components/ui";
import { ArrowRight, CalendarHeart, UserRound } from "lucide-react";

export const metadata = { title: "Pesquisa" };

// A pesquisa do painel cobre o que é do anfitrião: os seus eventos e convidados.
// O diretório de fornecedores é público e pesquisa-se no site (/fornecedores).
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [user, sp] = await Promise.all([requireUser(), searchParams]);
  const q = String(sp.q ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  const ci = { contains: q, mode: "insensitive" as const };
  const digits = q.replace(/\D/g, "");

  const [events, guests] = q
    ? await Promise.all([
        db.event.findMany({
          where: { AND: [accessibleEventWhere(user.id), { OR: [{ title: ci }, { hostNames: ci }, { venueName: ci }] }] },
          orderBy: { date: "asc" },
          take: 10,
          select: { id: true, title: true, hostNames: true, venueName: true, date: true, timezone: true },
        }),
        db.guest.findMany({
          // Dados dos convidados só para dono e editores (a receção não os vê na lista de convidados).
          where: { event: editableEventWhere(user.id), OR: [{ name: ci }, ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : [])] },
          orderBy: { name: "asc" },
          take: 20,
          select: { id: true, name: true, phone: true, rsvpStatus: true, suspendedAt: true, eventId: true, event: { select: { title: true } } },
        }),
      ])
    : [[], []];
  const total = events.length + guests.length;

  return (
    <>
      <p className="eyebrow">Pesquisa</p>
      <PageHeader title={q ? `Resultados para “${q}”` : "Pesquisar"} subtitle={q ? `${total} resultado${total === 1 ? "" : "s"} em eventos e convidados.` : "Use a barra de pesquisa para encontrar os seus eventos e convidados."} />

      {q && total === 0 && <EmptyState title="Sem resultados" description="Experimente outro nome, o telefone de um convidado ou o nome de um local." />}

      <div className="space-y-8">
        {events.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><span className="icon-circle h-8 w-8 bg-brand-100 text-brand-700"><CalendarHeart className="h-4 w-4" strokeWidth={1.75} aria-hidden /></span>Eventos <span className="text-sm font-normal text-muted">· {events.length}</span></h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {events.map((e) => (
                <li key={e.id}>
                  <Link href={`/dashboard/events/${e.id}`} className="card flex items-center justify-between gap-3 p-4 transition hover:-translate-y-0.5">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{e.title}</p>
                      <p className="text-xs text-muted">{e.hostNames} · {formatEventDate(e.date, false, e.timezone)} · {e.venueName}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 flex-none text-brand-500" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {guests.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><span className="icon-circle h-8 w-8 bg-brand-100 text-brand-700"><UserRound className="h-4 w-4" strokeWidth={1.75} aria-hidden /></span>Convidados <span className="text-sm font-normal text-muted">· {guests.length}</span></h2>
            <ul className="card divide-y divide-brand-100 p-0">
              {guests.map((g) => (
                <li key={g.id}>
                  <Link href={`/dashboard/events/${g.eventId}/guests/${g.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition hover:bg-brand-50">
                    <div className="min-w-0">
                      <p className="font-medium">{g.name} <span className="ml-1 text-xs font-normal text-muted">{formatPhone(g.phone)}</span></p>
                      <p className="text-xs text-muted">{g.event.title}</p>
                    </div>
                    <RsvpBadge status={g.suspendedAt ? "SUSPENDED" : g.rsvpStatus} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
