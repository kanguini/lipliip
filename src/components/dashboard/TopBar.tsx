import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { unreadBadge } from "@/lib/notifications";

/** Barra superior do painel: pesquisa global, sino de notificações e atalho para a conta. */
export function TopBar({ name, unread, query = "" }: { name: string; unread: number; query?: string }) {
  const badge = unreadBadge(unread);
  return (
    <div className="sticky top-0 z-30 bg-white shadow-[0_2px_16px_rgba(84,27,56,0.06)]">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-2.5 lg:px-10">
        <form action="/dashboard/search" method="get" role="search" className="relative min-w-0 flex-1 sm:max-w-md">
          <label htmlFor="global-search" className="sr-only">Pesquisar eventos, convidados e fornecedores</label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" strokeWidth={1.75} aria-hidden />
          <input id="global-search" name="q" type="search" defaultValue={query} className="input bg-brand-50 py-2 pl-11 shadow-none focus:bg-white" placeholder="Pesquisar eventos, convidados…" maxLength={80} autoComplete="off" />
        </form>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/dashboard/notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full text-brand-700 transition hover:bg-brand-100" aria-label={badge ? `Notificações: ${badge} por ler` : "Notificações"} title="Notificações">
            <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            {badge && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-joy-coral px-1 text-[0.6875rem] font-semibold leading-none text-white shadow-sm" aria-hidden>
                {badge}
              </span>
            )}
          </Link>
          <Link href="/dashboard/account" className="flex h-10 w-10 items-center justify-center rounded-full bg-joy-sun font-display text-lg text-brand-800 transition hover:ring-4 hover:ring-brand-100" aria-label="A minha conta" title={name}>
            {name.charAt(0).toUpperCase()}
          </Link>
        </div>
      </div>
    </div>
  );
}
