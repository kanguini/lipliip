import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { formatDateTimeShort } from "@/lib/format";
import { supplierCategoryLabel, supplierWhatsappUrl } from "@/lib/suppliers";
import { Badge, EmptyState, FlashFromSearch, PageHeader } from "@/components/ui";
import { setServiceRequestStatusAction } from "../suppliers-actions";
import { Check, MessageCircle, Phone, RotateCcw } from "lucide-react";

export const metadata = { title: "Pedidos de serviços" };

const STATUSES = [
  { id: "NEW", label: "Novo", tone: "pending" },
  { id: "CONTACTED", label: "Contactado", tone: "info" },
  { id: "CLOSED", label: "Fechado", tone: "ok" },
] as const;

export default async function ServiceRequestsPage({ searchParams }: { searchParams: Promise<{ status?: string; supplier?: string; ok?: string; error?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = STATUSES.some((s) => s.id === sp.status) ? sp.status! : "";
  const supplierId = (sp.supplier ?? "").slice(0, 40);
  const where: Prisma.ServiceRequestWhereInput = {};
  if (status) where.status = status;
  if (supplierId) where.supplierId = supplierId;
  const back = `/admin/service-requests${status || supplierId ? `?${new URLSearchParams({ ...(status ? { status } : {}), ...(supplierId ? { supplier: supplierId } : {}) })}` : ""}`;

  const [requests, counts, supplier] = await Promise.all([
    db.serviceRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, name: true, phone: true, email: true, message: true, status: true, createdAt: true,
        supplier: { select: { id: true, name: true, category: true } },
        user: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, title: true } },
      },
    }),
    db.serviceRequest.groupBy({ by: ["status"], where: supplierId ? { supplierId } : {}, _count: { _all: true } }),
    supplierId ? db.supplier.findUnique({ where: { id: supplierId }, select: { name: true } }) : Promise.resolve(null),
  ]);
  const countOf = (id: string) => counts.find((c) => c.status === id)?._count._all ?? 0;
  const total = counts.reduce((n, c) => n + c._count._all, 0);

  return (
    <>
      <p className="eyebrow">Diretório</p>
      <PageHeader title="Pedidos de serviços" subtitle={supplier ? `Pedidos feitos a ${supplier.name}.` : "Pedidos de orçamento feitos aos fornecedores do diretório."} />
      <FlashFromSearch ok={sp.ok} error={sp.error} />

      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Estado">
        <Link href={`/admin/service-requests${supplierId ? `?supplier=${supplierId}` : ""}`} className={`rounded-full px-4 py-2 text-sm transition ${!status ? "bg-brand-700 text-white" : "bg-white text-brand-800 hover:bg-brand-100"}`}>Todos <span className="opacity-70">· {total}</span></Link>
        {STATUSES.map((s) => (
          <Link key={s.id} href={`/admin/service-requests?${new URLSearchParams({ status: s.id, ...(supplierId ? { supplier: supplierId } : {}) })}`} className={`rounded-full px-4 py-2 text-sm transition ${status === s.id ? "bg-brand-700 text-white" : "bg-white text-brand-800 hover:bg-brand-100"}`}>
            {s.label} <span className="opacity-70">· {countOf(s.id)}</span>
          </Link>
        ))}
        {supplier && <Link href={`/admin/service-requests${status ? `?status=${status}` : ""}`} className="btn-ghost btn-sm">Todos os fornecedores</Link>}
      </nav>

      {requests.length === 0 ? (
        <EmptyState title="Sem pedidos" description={status ? "Não há pedidos neste estado." : "Quando alguém pedir um orçamento no diretório, aparece aqui."} />
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => {
            const st = STATUSES.find((s) => s.id === r.status) ?? STATUSES[0];
            const wa = supplierWhatsappUrl(r.phone);
            return (
              <li key={r.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <Badge tone={st.tone}>{st.label}</Badge>
                      <span className="text-xs text-muted">{formatDateTimeShort(r.createdAt, "Africa/Luanda")}</span>
                    </p>
                    <p className="mt-2 font-semibold">
                      {r.name} <span className="font-normal text-muted">pediu orçamento a</span> <Link href={`/admin/suppliers/${r.supplier.id}`} className="underline">{r.supplier.name}</Link>
                      <span className="ml-1 text-xs font-normal text-muted">({supplierCategoryLabel(r.supplier.category)})</span>
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {r.phone}{r.email && <> · {r.email}</>}
                      {r.user && <> · conta: {r.user.name} ({r.user.email})</>}
                      {r.event && <> · evento: {r.event.title}</>}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-secondary btn-sm"><MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />WhatsApp</a>}
                    <a href={`tel:${r.phone}`} className="btn-secondary btn-sm"><Phone className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />Ligar</a>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line rounded-2xl bg-brand-50 px-4 py-3 text-sm leading-relaxed">{r.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status !== "CONTACTED" && (
                    <form action={setServiceRequestStatusAction.bind(null, r.id, "CONTACTED", back)}>
                      <button className="btn-primary btn-sm"><Check className="h-3.5 w-3.5" aria-hidden />Marcar como contactado</button>
                    </form>
                  )}
                  {r.status !== "CLOSED" && (
                    <form action={setServiceRequestStatusAction.bind(null, r.id, "CLOSED", back)}>
                      <button className="btn-secondary btn-sm">Fechar pedido</button>
                    </form>
                  )}
                  {r.status !== "NEW" && (
                    <form action={setServiceRequestStatusAction.bind(null, r.id, "NEW", back)}>
                      <button className="btn-ghost btn-sm"><RotateCcw className="h-3.5 w-3.5" aria-hidden />Voltar a novo</button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
