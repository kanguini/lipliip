"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  ["", "Resumo"],
  ["/guests", "Convidados"],
  ["/tables", "Mesas"],
  ["/content", "Conteúdo"],
  ["/gifts", "Presentes"],
  ["/guestbook", "Mensagens"],
  ["/checkin", "Check-in"],
  ["/design", "Design"],
  ["/settings", "Definições"],
];

export function EventTabs({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/events/${eventId}`;
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-stone-200 text-sm">
      {TABS.map(([suffix, label]) => {
        const href = base + suffix;
        const active = suffix === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 ${active ? "border-brand-600 font-semibold text-brand-700" : "border-transparent text-stone-500 hover:text-stone-900"}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
