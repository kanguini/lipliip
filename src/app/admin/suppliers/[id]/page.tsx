import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { formatDateTimeShort } from "@/lib/format";
import { BackLink, FlashFromSearch, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { deleteSupplierAction, removeSupplierImageAction, updateSupplierAction } from "../../suppliers-actions";
import { SupplierFormFields } from "../form";
import { ArrowUpRight } from "lucide-react";

export const metadata = { title: "Editar fornecedor" };

const STATUS_LABEL: Record<string, string> = { NEW: "Novo", CONTACTED: "Contactado", CLOSED: "Fechado" };

export default async function EditSupplierPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [supplier, requests] = await Promise.all([
    db.supplier.findUnique({ where: { id } }),
    db.serviceRequest.findMany({ where: { supplierId: id }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, name: true, phone: true, status: true, createdAt: true } }),
  ]);
  if (!supplier) notFound();

  return (
    <>
      <BackLink href="/admin/suppliers">Fornecedores</BackLink>
      <PageHeader
        title={supplier.name}
        subtitle={supplier.active ? "Publicado no diretório." : "Escondido do diretório."}
        actions={
          <>
            {supplier.active && <Link href={`/fornecedores/${supplier.id}`} className="btn-secondary" target="_blank">Ver página pública <ArrowUpRight className="h-4 w-4" aria-hidden /></Link>}
            <form action={deleteSupplierAction.bind(null, supplier.id)}>
              <ConfirmButton className="btn-danger" message={`Eliminar o fornecedor ${supplier.name}? Os pedidos de orçamento associados também são eliminados.`}>Eliminar</ConfirmButton>
            </form>
          </>
        }
      />
      <FlashFromSearch {...sp} />
      <form action={updateSupplierAction.bind(null, supplier.id)}>
        <SupplierFormFields supplier={supplier} />
      </form>
      {supplier.imageMediaId && (
        <form action={removeSupplierImageAction.bind(null, supplier.id)} className="mt-3">
          <ConfirmButton className="btn-ghost btn-sm text-red-700" message="Remover a fotografia deste fornecedor?">Remover fotografia</ConfirmButton>
        </form>
      )}

      <section className="card mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Pedidos de orçamento recentes</h2>
          <Link href={`/admin/service-requests?supplier=${supplier.id}`} className="text-sm text-brand-700 underline">Ver todos</Link>
        </div>
        {requests.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Ainda ninguém pediu orçamento a este fornecedor.</p>
        ) : (
          <ul className="mt-3 divide-y divide-brand-100 text-sm">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span><strong>{r.name}</strong> · {r.phone}</span>
                <span className="text-xs text-muted">{STATUS_LABEL[r.status] ?? r.status} · {formatDateTimeShort(r.createdAt, "Africa/Luanda")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
