import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { mediaUrl } from "@/lib/media";
import { formatDateTimeShort } from "@/lib/format";
import { ANGOLA_PROVINCES, SUPPLIER_CATEGORIES, parseSupplierFilters, supplierCategoryLabel, supplierFiltersQuery, supplierLocation } from "@/lib/suppliers";
import { SupplierCategoryIcon } from "@/components/site/SupplierCategoryIcon";
import { EmptyState, FlashFromSearch, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { deleteSupplierAction, toggleSupplierAction } from "../suppliers-actions";
import { ArrowUpRight, Eye, EyeOff, Pencil, Plus, Search, Star } from "lucide-react";

export const metadata = { title: "Fornecedores" };

type Search = { category?: string; province?: string; q?: string; state?: string; ok?: string; error?: string };

export default async function AdminSuppliersPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const sp = await searchParams;
  const filters = parseSupplierFilters(sp);
  const state = sp.state === "active" || sp.state === "inactive" || sp.state === "featured" ? sp.state : "";
  const where: Prisma.SupplierWhereInput = {};
  if (filters.category) where.category = filters.category;
  if (filters.province) where.province = filters.province;
  if (state === "active") where.active = true;
  if (state === "inactive") where.active = false;
  if (state === "featured") where.featured = true;
  if (filters.q) where.OR = [{ name: { contains: filters.q, mode: "insensitive" } }, { city: { contains: filters.q, mode: "insensitive" } }, { email: { contains: filters.q, mode: "insensitive" } }];

  const [suppliers, counts] = await Promise.all([
    db.supplier.findMany({
      where,
      orderBy: [{ featured: "desc" }, { active: "desc" }, { name: "asc" }],
      take: 200,
      select: { id: true, name: true, category: true, city: true, province: true, imageMediaId: true, featured: true, active: true, updatedAt: true, _count: { select: { requests: true } } },
    }),
    db.supplier.groupBy({ by: ["active"], _count: { _all: true } }),
  ]);
  const totalActive = counts.find((c) => c.active)?._count._all ?? 0;
  const totalInactive = counts.find((c) => !c.active)?._count._all ?? 0;
  const back = `/admin/suppliers${supplierFiltersQuery(filters)}${state ? `${supplierFiltersQuery(filters) ? "&" : "?"}state=${state}` : ""}`;

  return (
    <>
      <p className="eyebrow">Diretório</p>
      <PageHeader
        title="Fornecedores"
        subtitle={`${totalActive} ativos · ${totalInactive} escondidos`}
        actions={
          <>
            <Link href="/fornecedores" className="btn-secondary" target="_blank">Ver diretório <ArrowUpRight className="h-4 w-4" aria-hidden /></Link>
            <Link href="/admin/suppliers/new" className="btn-primary"><Plus className="h-4 w-4" aria-hidden />Novo fornecedor</Link>
          </>
        }
      />
      <FlashFromSearch ok={sp.ok} error={sp.error} />

      <form method="get" action="/admin/suppliers" className="card mb-6 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto_auto]">
        <label className="relative">
          <span className="sr-only">Pesquisar</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" strokeWidth={1.75} aria-hidden />
          <input name="q" defaultValue={filters.q} className="input pl-11" placeholder="Nome, cidade ou email…" maxLength={80} />
        </label>
        <select name="category" className="input sm:w-52" defaultValue={filters.category ?? ""} aria-label="Categoria">
          <option value="">Todas as categorias</option>
          {SUPPLIER_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select name="province" className="input sm:w-44" defaultValue={filters.province ?? ""} aria-label="Província">
          <option value="">Todas as províncias</option>
          {ANGOLA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select name="state" className="input sm:w-36" defaultValue={state} aria-label="Estado">
          <option value="">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Escondidos</option>
          <option value="featured">Em destaque</option>
        </select>
        <button className="btn-secondary">Filtrar</button>
      </form>

      {suppliers.length === 0 ? (
        <EmptyState title="Nenhum fornecedor" description="Crie o primeiro fornecedor do diretório ou ajuste os filtros." action={<Link href="/admin/suppliers/new" className="btn-primary">Novo fornecedor</Link>} />
      ) : (
        <ul className="space-y-3">
          {suppliers.map((s) => (
            <li key={s.id} className={`card flex flex-wrap items-center gap-4 p-4 ${s.active ? "" : "opacity-70"}`}>
              <div className="h-16 w-16 flex-none overflow-hidden rounded-2xl bg-brand-50">
                {s.imageMediaId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(s.imageMediaId)} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-brand-700"><SupplierCategoryIcon category={s.category} className="h-6 w-6" /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  <Link href={`/admin/suppliers/${s.id}`} className="hover:underline">{s.name}</Link>
                  {s.featured && <span className="badge bg-joy-sun text-brand-800"><Star className="mr-1 h-3 w-3" aria-hidden />Destaque</span>}
                  {!s.active && <span className="badge bg-[#eeeaee] text-[#6d5e69]">Escondido</span>}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {supplierCategoryLabel(s.category)}
                  {supplierLocation(s) && <> · {supplierLocation(s)}</>}
                  {" · "}{s._count.requests} pedido{s._count.requests === 1 ? "" : "s"}
                  {" · "}atualizado {formatDateTimeShort(s.updatedAt, "Africa/Luanda")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <form action={toggleSupplierAction.bind(null, s.id, "featured", back)}>
                  <button className="btn-ghost btn-sm" title={s.featured ? "Remover destaque" : "Pôr em destaque"}><Star className={`h-3.5 w-3.5 ${s.featured ? "fill-joy-sun text-joy-sun" : ""}`} strokeWidth={1.75} aria-hidden />{s.featured ? "Destacado" : "Destacar"}</button>
                </form>
                <form action={toggleSupplierAction.bind(null, s.id, "active", back)}>
                  <button className="btn-ghost btn-sm" title={s.active ? "Esconder do diretório" : "Publicar no diretório"}>{s.active ? <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden /> : <Eye className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}{s.active ? "Esconder" : "Publicar"}</button>
                </form>
                <Link href={`/admin/suppliers/${s.id}`} className="btn-secondary btn-sm"><Pencil className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />Editar</Link>
                <form action={deleteSupplierAction.bind(null, s.id)}>
                  <ConfirmButton message={`Eliminar o fornecedor ${s.name}? Os pedidos de orçamento associados também são eliminados.`}>Eliminar</ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
