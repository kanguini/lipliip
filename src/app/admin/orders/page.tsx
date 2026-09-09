import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { formatDateTimeShort, formatMoney } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { ORDER_STATUS_LABEL } from "@/lib/activation";
import { approveOrderAction, rejectOrderAction } from "@/app/admin/actions";
import { EmptyState, FlashFromSearch, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { FileText } from "lucide-react";

export const metadata = { title: "Pagamentos · Administração" };

const TABS = [
  ["PENDING", "Pendentes"],
  ["APPROVED", "Aprovados"],
  ["REJECTED", "Rejeitados"],
] as const;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; ok?: string; error?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = TABS.some(([s]) => s === sp.status) ? (sp.status as string) : "PENDING";
  const returnTo = `/admin/orders?status=${status}`;
  const [orders, counts] = await Promise.all([
    db.order.findMany({
      where: { status },
      orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" },
      take: 200,
      select: {
        id: true, amount: true, currency: true, reference: true, status: true, note: true, adminNote: true, createdAt: true, reviewedAt: true, proofMediaId: true,
        user: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, title: true, activatedAt: true } },
        reviewedBy: { select: { name: true } },
      },
    }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;

  return (
    <>
      <PageHeader title="Pagamentos" subtitle="Pedidos de ativação por transferência bancária, com comprovativo." />
      <FlashFromSearch ok={sp.ok} error={sp.error} />
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map(([s, label]) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={`rounded-full px-4 py-1.5 text-sm transition ${status === s ? "bg-brand-700 text-white" : "bg-white text-brand-800 hover:bg-brand-100"}`}>
            {label} <span className={status === s ? "text-white/70" : "text-muted"}>· {countOf(s)}</span>
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState title={status === "PENDING" ? "Nada por aprovar" : "Sem pedidos"} description={status === "PENDING" ? "Quando um organizador enviar um comprovativo, aparece aqui." : undefined} />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Utilizador</th>
                <th className="px-3 py-3 font-medium">Evento</th>
                <th className="px-3 py-3 font-medium">Valor</th>
                <th className="px-3 py-3 font-medium">Referência</th>
                <th className="px-3 py-3 font-medium">Data</th>
                <th className="px-3 py-3 font-medium">Comprovativo</th>
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {orders.map((o) => (
                <tr key={o.id} className="align-top">
                  <td className="px-5 py-3">
                    <Link href={`/admin/users/${o.user.id}`} className="font-medium hover:underline">{o.user.name}</Link>
                    <p className="text-xs text-muted">{o.user.email}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium">{o.event.title}</p>
                    <p className="text-xs text-muted">{o.event.activatedAt ? `ativado ${formatDateTimeShort(o.event.activatedAt)}` : "não ativado"}</p>
                    {o.note && <p className="mt-1 text-xs italic text-muted">Nota: {o.note}</p>}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">{formatMoney(o.amount, o.currency)}</td>
                  <td className="px-3 py-3 font-mono">{o.reference}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs">
                    {formatDateTimeShort(o.createdAt)}
                    {o.reviewedAt && <p className="text-muted">revisto {formatDateTimeShort(o.reviewedAt)}{o.reviewedBy ? ` · ${o.reviewedBy.name}` : ""}</p>}
                    {o.status === "REJECTED" && o.adminNote && <p className="mt-1 text-red-800">{o.adminNote}</p>}
                  </td>
                  <td className="px-3 py-3">
                    {o.proofMediaId ? <a href={mediaUrl(o.proofMediaId)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-700 underline"><FileText className="h-4 w-4" strokeWidth={1.75} aria-hidden />Ver</a> : <span className="text-muted">sem ficheiro</span>}
                  </td>
                  <td className="px-5 py-3">
                    {o.status !== "APPROVED" && (
                      <div className="flex flex-col items-end gap-2">
                        <form action={approveOrderAction.bind(null, o.id, returnTo)}>
                          <ConfirmButton className="btn-primary btn-sm" message={`Aprovar o pedido ${o.reference} de ${o.user.name} e ativar "${o.event.title}"?`}>Aprovar</ConfirmButton>
                        </form>
                        {o.status === "PENDING" && (
                          <details className="text-right">
                            <summary className="cursor-pointer text-xs text-red-700">Rejeitar…</summary>
                            <form action={rejectOrderAction.bind(null, o.id, returnTo)} className="mt-2 flex w-64 flex-col gap-2">
                              <label className="label text-xs" htmlFor={`note-${o.id}`}>Motivo (mostrado ao utilizador)</label>
                              <textarea id={`note-${o.id}`} name="adminNote" className="input text-xs" rows={2} required minLength={3} placeholder="Ex.: o comprovativo não corresponde ao valor." />
                              <ConfirmButton className="btn-danger btn-sm" message={`Rejeitar o pedido ${o.reference}? O utilizador verá o motivo e poderá enviar um novo comprovativo.`}>Rejeitar</ConfirmButton>
                            </form>
                          </details>
                        )}
                      </div>
                    )}
                    {o.status === "APPROVED" && <span className="badge bg-[#e9f2eb] text-[#416c4a]">{ORDER_STATUS_LABEL.APPROVED}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
