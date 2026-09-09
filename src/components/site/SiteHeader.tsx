import Link from "next/link";

/** Cabeçalho das páginas públicas (landing e diretório de fornecedores). */
export function SiteHeader({ loggedIn, active }: { loggedIn: boolean; active?: "fornecedores" }) {
  return (
    <header className="bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="wordmark text-3xl" aria-label="Liplip">
          liplip<span>.</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link href="/fornecedores" className={`btn-ghost ${active === "fornecedores" ? "bg-brand-100" : ""}`} aria-current={active === "fornecedores" ? "page" : undefined}>
            Fornecedores
          </Link>
          {loggedIn ? (
            <Link href="/dashboard" className="btn-primary">Ir para o painel</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden sm:inline-flex">Entrar</Link>
              <Link href="/register" className="btn-primary">Criar conta grátis</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="py-12 text-center text-sm text-muted">
      <span className="wordmark text-2xl">liplip<span>.</span></span>
      <p className="mt-2">Os momentos passam. Os laços ficam.</p>
      <nav className="mt-4 flex justify-center gap-4 text-xs">
        <Link href="/" className="hover:text-brand-700">Convites digitais</Link>
        <Link href="/fornecedores" className="hover:text-brand-700">Fornecedores</Link>
      </nav>
    </footer>
  );
}
