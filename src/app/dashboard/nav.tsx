"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarHeart, Mail, ShieldCheck, Store, UserRound } from "lucide-react";

const ITEMS = [
  { href: "/dashboard/invites", label: "Convites digitais", hint: "Templates e criar convite", icon: Mail, mobileOnly: false },
  { href: "/dashboard", label: "Eventos", hint: "Os seus eventos e convidados", icon: CalendarHeart, mobileOnly: false },
  { href: "/fornecedores", label: "Fornecedores", hint: "Salões, buffet, decoração e mais", icon: Store, mobileOnly: false },
  { href: "/dashboard/account", label: "A minha conta", hint: "Perfil e palavra-passe", icon: UserRound, mobileOnly: true },
];
const ADMIN_ITEM = { href: "/admin", label: "Administração", hint: "Utilizadores, pagamentos e site", icon: ShieldCheck, mobileOnly: false };

export function DashboardNav({ admin = false }: { admin?: boolean }) {
  const pathname = usePathname();
  const items = admin ? [...ITEMS, ADMIN_ITEM] : ITEMS;
  return (
    <nav className="flex gap-2 overflow-x-auto px-4 pb-3 lg:block lg:space-y-1 lg:px-4 lg:pb-0">
      {items.map((it) => {
        const active = it.href === "/dashboard" ? pathname === "/dashboard" || pathname.startsWith("/dashboard/events") : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex items-center gap-3 whitespace-nowrap rounded-full px-4 py-3 text-sm transition ${it.mobileOnly ? "lg:hidden" : ""} ${active ? "bg-brand-700 text-white shadow-[0_6px_18px_rgba(84,27,56,0.22)]" : "text-brand-800 hover:bg-brand-100"}`}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${active ? "bg-white/15" : "bg-brand-100"}`}>
              <it.icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </span>
            <span>
              <span className="block font-semibold">{it.label}</span>
              <span className={`hidden text-[11px] lg:block ${active ? "text-white/70" : "text-muted"}`}>{it.hint}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
