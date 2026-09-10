import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";
import { ANGOLA_PROVINCES, SUPPLIER_CATEGORIES, parseSupplierFilters, supplierCategoryLabel, supplierExcerpt, supplierFiltersQuery, supplierLocation } from "@/lib/suppliers";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { SupplierCategoryIcon } from "@/components/site/SupplierCategoryIcon";
import { FlashFromSearch } from "@/components/ui";
import { MapPin, Search, Star, X } from "lucide-react";

export const metadata: Metadata = {
  title: "Fornecedores para o seu evento",
  description: "Salões, buffet, decoração, música, fotografia e muito mais: encontre fornecedores para casamentos, noivados e aniversários em Angola.",
};

const PAGE_SIZE = 48;

export default async function SuppliersDirectoryPage({ searchParams }: { searchParams: Promise<{ category?: string; province?: string; q?: string; ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const filters = parseSupplierFilters(sp);
  const where: Prisma.SupplierWhereInput = { active: true };
  if (filters.category) where.category = filters.category;
  if (filters.province) where.province = filters.province;
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { city: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  const [user, suppliers, total] = await Promise.all([
    getCurrentUser(),
    db.supplier.findMany({
      where,
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      take: PAGE_SIZE,
      select: { id: true, name: true, category: true, city: true, province: true, description: true, imageMediaId: true, featured: true },
    }),
    db.supplier.count({ where }),
  ]);
  const hasFilters = !!(filters.category || filters.province || filters.q);

  return (
    <main>
      <SiteHeader loggedIn={!!user} active="fornecedores" />

      <section className="relative mx-auto max-w-6xl overflow-hidden px-6 pb-8 pt-14">
        <span className="blob -left-20 top-4 h-56 w-56 bg-joy-sage/40" aria-hidden />
        <span className="blob right-10 top-0 h-40 w-40 bg-joy-sun/40" aria-hidden />
        <div className="relative max-w-2xl">
          <p className="eyebrow">Diretório de fornecedores</p>
          <h1 className="display-title mt-4 text-4xl leading-[1.05] sm:text-6xl">
            As pessoas que fazem a <em>festa</em> acontecer<span className="plum">.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Salões, buffet, decoração, música, fotografia e tudo o que o seu evento precisa. Peça orçamentos diretamente a partir daqui.
          </p>
        </div>

        <form method="get" action="/fornecedores" className="relative mt-8 flex flex-col gap-3 rounded-3xl bg-white p-3 shadow-[0_2px_24px_rgba(84,27,56,0.06)] sm:flex-row sm:items-center">
          {filters.category && <input type="hidden" name="category" value={filters.category} />}
          <label className="relative flex-1">
            <span className="sr-only">Pesquisar fornecedores</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" strokeWidth={1.75} aria-hidden />
            <input name="q" defaultValue={filters.q} className="input pl-11" placeholder="Pesquisar por nome, cidade ou serviço…" maxLength={80} />
          </label>
          <label className="sm:w-56">
            <span className="sr-only">Província</span>
            <select name="province" className="input" defaultValue={filters.province ?? ""}>
              <option value="">Todas as províncias</option>
              {ANGOLA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <button className="btn-primary">Pesquisar</button>
        </form>

        <nav className="relative mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Categorias">
          <Link href={`/fornecedores${supplierFiltersQuery({ ...filters, category: null })}`} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${!filters.category ? "bg-brand-700 text-white" : "bg-white text-brand-800 hover:bg-brand-100"}`}>
            Todas
          </Link>
          {SUPPLIER_CATEGORIES.map((c) => {
            const active = filters.category === c.id;
            return (
              <Link key={c.id} href={`/fornecedores${supplierFiltersQuery({ ...filters, category: active ? null : c.id })}`} className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${active ? "bg-brand-700 text-white" : "bg-white text-brand-800 hover:bg-brand-100"}`}>
                <SupplierCategoryIcon category={c.id} className="h-4 w-4" />
                {c.label}
              </Link>
            );
          })}
        </nav>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <FlashFromSearch ok={sp.ok} error={sp.error} />
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {total === 0 ? "Nenhum fornecedor encontrado" : total === 1 ? "1 fornecedor" : `${total} fornecedores`}
            {filters.category && <> em <strong className="text-brand-800">{supplierCategoryLabel(filters.category)}</strong></>}
            {filters.province && <> · <strong className="text-brand-800">{filters.province}</strong></>}
            {filters.q && <> · &ldquo;{filters.q}&rdquo;</>}
          </p>
          {hasFilters && (
            <Link href="/fornecedores" className="btn-ghost btn-sm"><X className="h-3.5 w-3.5" aria-hidden />Limpar filtros</Link>
          )}
        </div>

        {suppliers.length === 0 ? (
          <div className="card flex flex-col items-center py-14 text-center">
            <p className="font-display text-2xl">Ainda não temos fornecedores aqui</p>
            <p className="mt-1 max-w-md text-sm text-muted">Experimente outra categoria ou província. Estamos a acrescentar fornecedores todas as semanas.</p>
            {hasFilters && <Link href="/fornecedores" className="btn-secondary mt-4">Ver todos</Link>}
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((s) => {
              const location = supplierLocation(s);
              return (
                <li key={s.id}>
                  <Link href={`/fornecedores/${s.id}`} className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_2px_24px_rgba(84,27,56,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(84,27,56,0.14)]">
                    <div className="relative aspect-[4/3] bg-brand-50">
                      {s.imageMediaId ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl(s.imageMediaId)} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="icon-circle h-16 w-16 bg-brand-100 text-brand-700"><SupplierCategoryIcon category={s.category} className="h-7 w-7" strokeWidth={1.5} /></span>
                        </div>
                      )}
                      {s.featured && (
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-joy-sun px-2.5 py-1 text-[0.6875rem] font-semibold text-brand-800 shadow-sm">
                          <Star className="h-3 w-3" strokeWidth={2} aria-hidden />Em destaque
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <span className="text-[0.65rem] uppercase tracking-[0.12em] text-brand-500">{supplierCategoryLabel(s.category)}</span>
                      <p className="font-display mt-1 text-xl leading-snug text-ink group-hover:text-brand-700">{s.name}</p>
                      {location && <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted"><MapPin className="h-3.5 w-3.5 text-brand-500" strokeWidth={1.75} aria-hidden />{location}</p>}
                      {s.description && <p className="mt-3 text-sm leading-relaxed text-muted">{supplierExcerpt(s.description)}</p>}
                      <span className="mt-auto pt-4 text-sm font-semibold text-brand-700">Ver detalhes e pedir orçamento</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {total > suppliers.length && <p className="mt-6 text-center text-xs text-muted">A mostrar os primeiros {suppliers.length} de {total}. Use os filtros para afinar a pesquisa.</p>}
      </section>

      <SiteFooter />
    </main>
  );
}
