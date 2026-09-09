"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard", label: "Os meus eventos", icon: "📅", exact: true },
  { href: "/dashboard/events/new", label: "Novo evento", icon: "✨" },
  { href: "/dashboard/account", label: "A minha conta", icon: "👤" },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-4 pb-3 lg:block lg:px-4 lg:pb-0">
      <p className="hidden px-4 pb-3 text-[0.65rem] tracking-[0.13em] text-[#93858e] lg:block">O SEU ESPAÇO</p>
      {ITEMS.map((it) => {
        const active = it.exact ? pathname === it.href || pathname.startsWith("/dashboard/events/c") : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-4 py-3 text-sm transition ${active ? "bg-brand-100 text-brand-700 shadow-[inset_3px_0_0_#541b38]" : "text-[#5e4b58] hover:bg-brand-50"}`}
          >
            <span aria-hidden>{it.icon}</span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
