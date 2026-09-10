import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";
import { DashboardNav } from "./nav";
import { Quotes } from "@/components/dashboard/Quotes";
import { TopBar } from "@/components/dashboard/TopBar";
import { loadNotifications } from "./notifications/data";
import { LogOut } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { items, unread } = await loadNotifications(user);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16.5rem_1fr]">
      <aside className="bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex items-center justify-between px-6 py-5 lg:block lg:px-7 lg:pb-6 lg:pt-8">
          <Link href="/dashboard" className="wordmark block text-4xl leading-none lg:text-[2.6rem]" aria-label="Liplip">liplip<span>.</span></Link>
          <form action={logoutAction} className="lg:hidden">
            <button className="btn-ghost btn-sm">Sair</button>
          </form>
        </div>
        <DashboardNav />
        <div className="hidden lg:mt-auto lg:block">
          <Quotes />
        </div>
        <div className="hidden items-center gap-3 px-6 py-5 lg:flex">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-joy-sun font-display text-lg text-brand-800">{user.name.charAt(0).toUpperCase()}</div>
          <div className="min-w-0 flex-1">
            <Link href="/dashboard/account" className="block truncate text-sm font-semibold hover:underline">{user.name}</Link>
            <span className="block text-xs text-muted">A minha conta</span>
          </div>
          <form action={logoutAction}>
            <button className="flex h-9 w-9 items-center justify-center rounded-full text-brand-700 hover:bg-brand-100" title="Terminar sessão" aria-label="Terminar sessão"><LogOut className="h-4 w-4" aria-hidden /></button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">
        <TopBar name={user.name} unread={unread} items={items} />
        <main className="px-5 py-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
