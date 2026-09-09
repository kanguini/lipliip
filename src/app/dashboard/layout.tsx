import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";
import { DashboardNav } from "./nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15.5rem_1fr]">
      <aside className="border-b border-brand-200/70 bg-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-6 py-5 lg:block lg:px-7 lg:pb-8 lg:pt-9">
          <div>
            <Link href="/dashboard" className="wordmark block text-4xl leading-none lg:text-5xl" aria-label="Lipliip">lipliip<span>.</span></Link>
            <span className="mt-2 hidden text-[0.63rem] tracking-[0.12em] text-[#84757f] lg:block">CONVITES &amp; CELEBRAÇÕES</span>
          </div>
          <form action={logoutAction} className="lg:hidden">
            <button className="btn-ghost btn-sm">Sair</button>
          </form>
        </div>
        <DashboardNav />
        <div className="mx-7 mt-10 hidden border-t border-brand-200/70 pt-6 text-[0.8125rem] text-[#85717f] lg:block">
          <p className="font-display text-lg leading-snug text-brand-700">As pessoas certas.<br />O seu momento.</p>
          <p className="mt-2 leading-relaxed">Um convite pessoal, ligado ao contacto de cada convidado.</p>
          <Link href="/#como-funciona" className="mt-4 inline-block text-brand-700 underline-offset-4 hover:underline">Como funciona ↗</Link>
        </div>
        <div className="hidden items-center gap-3 border-t border-brand-200/70 px-6 py-5 lg:absolute lg:bottom-0 lg:left-0 lg:right-0 lg:flex">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-100 text-sm text-brand-700">{user.name.charAt(0).toUpperCase()}</div>
          <div className="min-w-0 flex-1">
            <Link href="/dashboard/account" className="block truncate text-sm font-semibold hover:underline">{user.name}</Link>
            <span className="block text-xs text-[#8f808a]">Organizador</span>
          </div>
          <form action={logoutAction}>
            <button className="btn-ghost btn-sm" title="Terminar sessão">Sair</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 px-5 py-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
