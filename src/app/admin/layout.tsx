import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { logoutAction } from "@/app/(auth)/actions";
import { AdminNav } from "./nav";
import { LogOut } from "lucide-react";

export const metadata = { title: "Administração · Liplip" };

/** Área de administração da plataforma: só para utilizadores com papel ADMIN (ou em ADMIN_EMAILS). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16.5rem_1fr]">
      <aside className="bg-brand-900 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex items-center justify-between px-6 py-5 lg:block lg:px-7 lg:pb-6 lg:pt-8">
          <Link href="/admin" className="wordmark block text-4xl leading-none text-white lg:text-[2.6rem]" aria-label="Liplip">liplip<span className="text-joy-coral">.</span></Link>
          <p className="mt-1 hidden text-[11px] uppercase tracking-[0.3em] text-white/60 lg:block">Administração</p>
        </div>
        <AdminNav />
        <div className="hidden items-center gap-3 px-6 py-5 lg:mt-auto lg:flex">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-joy-sun font-display text-lg text-brand-800">{user.name.charAt(0).toUpperCase()}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="block text-xs text-white/70">Administrador da plataforma</p>
          </div>
          <form action={logoutAction}>
            <button className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10" title="Terminar sessão" aria-label="Terminar sessão"><LogOut className="h-4 w-4" aria-hidden /></button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 px-5 py-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
