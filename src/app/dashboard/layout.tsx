import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/dashboard" className="font-display text-2xl font-semibold text-brand-700">Lipliip</Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/dashboard/account" className="text-stone-600 hover:text-stone-900">{user.name}</Link>
            <form action={logoutAction}>
              <button className="btn-ghost btn-sm">Sair</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
