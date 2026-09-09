"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck, CalendarHeart, Gauge, Inbox, LayoutTemplate, Settings, Store, Users } from "lucide-react";

const ITEMS = [
  { href: "/admin", label: "Painel", icon: Gauge, exact: true },
  { href: "/admin/orders", label: "Pagamentos", icon: BadgeCheck, exact: false },
  { href: "/admin/users", label: "Utilizadores", icon: Users, exact: false },
  { href: "/admin/events", label: "Eventos", icon: CalendarHeart, exact: false },
  { href: "/admin/templates", label: "Templates", icon: LayoutTemplate, exact: false },
  { href: "/admin/suppliers", label: "Fornecedores", icon: Store, exact: false },
  { href: "/admin/service-requests", label: "Pedidos de serviços", icon: Inbox, exact: false },
  { href: "/admin/settings", label: "Definições", icon: Settings, exact: false },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-4 pb-3 lg:block lg:space-y-1 lg:px-4 lg:pb-0">
      {ITEMS.map((it) => {
        const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={`flex items-center gap-3 whitespace-nowrap rounded-full px-4 py-2.5 text-sm transition ${active ? "bg-white text-brand-800" : "text-white/85 hover:bg-white/10"}`}>
            <it.icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            <span className="font-medium">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
