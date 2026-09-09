"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

function SearchInput() {
  const pathname = usePathname();
  const params = useSearchParams();
  // Na página de resultados o campo mantém o que foi pesquisado.
  const query = pathname === "/dashboard/search" ? (params.get("q") ?? "") : "";
  return (
    <input key={query} id="global-search" name="q" type="search" defaultValue={query} className="input bg-brand-50 py-2 pl-11 shadow-none focus:bg-white" placeholder="Pesquisar eventos, convidados…" maxLength={80} autoComplete="off" />
  );
}

/** Campo de pesquisa da barra superior, pré-preenchido na página de resultados. */
export function SearchBox() {
  return (
    <form action="/dashboard/search" method="get" role="search" className="relative min-w-0 flex-1 sm:max-w-md">
      <label htmlFor="global-search" className="sr-only">Pesquisar eventos, convidados e fornecedores</label>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" strokeWidth={1.75} aria-hidden />
      <Suspense fallback={<input className="input bg-brand-50 py-2 pl-11 shadow-none" placeholder="Pesquisar eventos, convidados…" disabled />}>
        <SearchInput />
      </Suspense>
    </form>
  );
}
