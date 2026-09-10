import Link from "next/link";
import type { NotificationItem } from "@/lib/notifications";
import { SearchBox } from "./SearchBox";
import { NotificationsBell } from "./NotificationsBell";

/** Barra superior do painel: pesquisa global, sino de notificações (pop-up) e atalho para a conta. Fundo transparente. */
export function TopBar({ name, unread, items }: { name: string; unread: number; items: NotificationItem[] }) {
  return (
    <div className="sticky top-0 z-30 bg-transparent">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-2.5 lg:px-10">
        <SearchBox />
        <div className="ml-auto flex items-center gap-2">
          <NotificationsBell unread={unread} items={items} />
          <Link href="/dashboard/account" className="flex h-10 w-10 items-center justify-center rounded-full bg-joy-sun font-display text-lg text-brand-800 transition hover:ring-4 hover:ring-brand-100" aria-label="A sua conta" title={name}>
            {name.charAt(0).toUpperCase()}
          </Link>
        </div>
      </div>
    </div>
  );
}
