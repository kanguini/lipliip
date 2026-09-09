import Link from "next/link";
import { Bell } from "lucide-react";
import { unreadBadge } from "@/lib/notifications";
import { SearchBox } from "./SearchBox";

/** Barra superior do painel: pesquisa global, sino de notificações e atalho para a conta. */
export function TopBar({ name, unread }: { name: string; unread: number }) {
  const badge = unreadBadge(unread);
  return (
    <div className="sticky top-0 z-30 bg-white shadow-[0_2px_16px_rgba(84,27,56,0.06)]">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-2.5 lg:px-10">
        <SearchBox />
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
