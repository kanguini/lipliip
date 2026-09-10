"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarHeart, Mail, UserRound } from "lucide-react";

// Navegação do anfitrião. A administração da plataforma vive numa área própria (/admin), separada da conta do cliente.
// O diretório de fornecedores é público e vive no site (/fornecedores), não aqui.
const ITEMS = [
  { href: "/dashboard/invites", label: "Convites digitais", icon: Mail, mobileOnly: false },
  { href: "/dashboard", label: "Eventos", icon: CalendarHeart, mobileOnly: false },
  { href: "/dashboard/account", label: "A sua conta", icon: UserRound, mobileOnly: true },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2 overflow-x-auto px-4 pb-3 lg:block lg:space-y-1 lg:px-4 lg:pb-0">
      {ITEMS.map((it) => {
        const active = it.href === "/dashboard" ? pathname === "/dashboard" || pathname.startsWith("/dashboard/events") : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex items-center gap-3 whitespace-nowrap rounded-full px-4 py-2.5 text-sm transition ${it.mobileOnly ? "lg:hidden" : ""} ${active ? "bg-brand-700 text-white shadow-[0_6px_18px_rgba(84,27,56,0.22)]" : "text-brand-800 hover:bg-brand-100"}`}
          >
            <span className={`flex aspect-square h-8 w-8 flex-none items-center justify-center rounded-full ${active ? "bg-white/15" : "bg-brand-100"}`}>
              <it.icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="font-semibold">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
