import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";
import { DashboardNav } from "./nav";
import { LogOut } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
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
        <div className="mx-6 mt-8 hidden rounded-3xl bg-brand-50 p-5 text-[0.8125rem] text-muted lg:block">
          <p className="font-display text-lg leading-snug text-brand-700">As pessoas certas.<br />O seu momento.</p>
          <p className="mt-2 leading-relaxed">Um convite pessoal, ligado ao contacto de cada convidado.</p>
        </div>
        <div className="hidden items-center gap-3 px-6 py-5 lg:mt-auto lg:flex">
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
      <main className="min-w-0 px-5 py-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
