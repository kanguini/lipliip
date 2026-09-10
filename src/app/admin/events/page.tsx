import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { formatDateTimeShort, formatEventDate, formatTime } from "@/lib/format";
import { eventTypeLabel } from "@/lib/event-types";
import { getTemplate } from "@/lib/templates";
import { getCustomTemplates } from "@/lib/custom-templates";
import { setEventActivationAction } from "@/app/admin/actions";
import { EmptyState, FlashFromSearch, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { Search } from "lucide-react";

export const metadata = { title: "Eventos · Administração" };

const PAGE_SIZE = 50;

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; only?: string; ok?: string; error?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const only = sp.only === "active" || sp.only === "inactive" ? sp.only : "";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const where: Prisma.EventWhereInput = {
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { hostNames: { contains: q, mode: "insensitive" } }, { owner: { email: { contains: q, mode: "insensitive" } } }] } : {}),
    ...(only === "active" ? { activatedAt: { not: null } } : only === "inactive" ? { activatedAt: null } : {}),
  };
  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, title: true, hostNames: true, type: true, templateId: true, date: true, timezone: true, venueName: true, country: true, activatedAt: true, createdAt: true,
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { guests: true, orders: true } },
      },
    }),
    db.event.count({ where }),
  ]);
  const customNames = new Map((await getCustomTemplates()).map((t) => [t.id, t.name]));
  const templateName = (templateId: string) => customNames.get(templateId) ?? getTemplate(templateId).name;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => `/admin/events?${new URLSearchParams({ ...(q ? { q } : {}), ...(only ? { only } : {}), ...(p > 1 ? { page: String(p) } : {}) }).toString()}`;
  const returnTo = qs(page);

  return (
    <>
      <PageHeader title="Eventos" subtitle={`${total} evento(s)${q ? ` a corresponder a "${q}"` : ""}.`} />
      <FlashFromSearch ok={sp.ok} error={sp.error} />
      <form className="mb-6 flex max-w-2xl flex-wrap gap-2">
        <input name="q" className="input flex-1" placeholder="Pesquisar por título, anfitriões ou email do dono" aria-label="Pesquisar eventos" defaultValue={q} />
        <select name="only" className="input w-40" defaultValue={only} aria-label="Filtrar por ativação">
          <option value="">Todos</option>
          <option value="active">Ativados</option>
          <option value="inactive">Não ativados</option>
        </select>
        <button className="btn-secondary"><Search className="h-4 w-4" strokeWidth={1.75} aria-hidden />Pesquisar</button>
      </form>

      {events.length === 0 ? (
        <EmptyState title="Sem resultados" description={q ? "Tente outro título ou email." : "Ainda não há eventos criados."} />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Título</th>
                <th className="px-3 py-3 font-medium">Tipo</th>
                <th className="px-3 py-3 font-medium">Data</th>
                <th className="px-3 py-3 font-medium">Dono</th>
                <th className="px-3 py-3 font-medium">Convidados</th>
                <th className="px-3 py-3 font-medium">Ativado</th>
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {events.map((e) => (
                <tr key={e.id} className="align-top">
                  <td className="px-5 py-3">
                    <details>
                      <summary className="cursor-pointer font-medium">{e.title}</summary>
                      <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs text-muted sm:grid-cols-2">
                        <div><dt className="inline font-medium">Anfitriões:</dt> <dd className="inline">{e.hostNames}</dd></div>
                        <div><dt className="inline font-medium">Local:</dt> <dd className="inline">{e.venueName}</dd></div>
                        <div><dt className="inline font-medium">Template:</dt> <dd className="inline">{templateName(e.templateId)}</dd></div>
                        <div><dt className="inline font-medium">País / fuso:</dt> <dd className="inline">{e.country} · {e.timezone}</dd></div>
                        <div><dt className="inline font-medium">Criado:</dt> <dd className="inline">{formatDateTimeShort(e.createdAt)}</dd></div>
                        <div><dt className="inline font-medium">Pedidos de ativação:</dt> <dd className="inline">{e._count.orders}</dd></div>
                      </dl>
                    </details>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">{eventTypeLabel(e.type)}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs">{formatEventDate(e.date, false, e.timezone)} · {formatTime(e.date, e.timezone)}</td>
                  <td className="px-3 py-3"><Link href={`/admin/users/${e.owner.id}`} className="hover:underline">{e.owner.name}</Link><p className="text-xs text-muted">{e.owner.email}</p></td>
                  <td className="px-3 py-3">{e._count.guests}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{e.activatedAt ? <span className="badge bg-[#e9f2eb] text-[#416c4a]" title={formatDateTimeShort(e.activatedAt)}>Sim · {formatDateTimeShort(e.activatedAt)}</span> : <span className="badge bg-[#f8f0de] text-[#8b6b2d]">Não</span>}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      <form action={setEventActivationAction.bind(null, e.id, !e.activatedAt, returnTo)}>
                        <ConfirmButton className={e.activatedAt ? "btn-ghost btn-sm text-red-700" : "btn-primary btn-sm"} message={e.activatedAt ? `Desativar "${e.title}"? Os convidados deixam de poder abrir o convite se a ativação for exigida.` : `Ativar "${e.title}" manualmente, sem pagamento registado?`}>{e.activatedAt ? "Desativar" : "Ativar"}</ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-muted">A administração não abre o painel do organizador: os eventos pertencem aos seus donos. Clique no título para ver os detalhes.</p>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted">Página {page} de {pages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={qs(page - 1)} className="btn-secondary btn-sm">Anterior</Link>}
            {page < pages && <Link href={qs(page + 1)} className="btn-secondary btn-sm">Seguinte</Link>}
          </div>
        </div>
      )}
    </>
  );
}
