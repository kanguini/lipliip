"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS: { label: string; tabs: [string, string][] }[] = [
  { label: "Planear", tabs: [["", "Resumo"], ["/tasks", "Tarefas"], ["/budget", "Orçamento"], ["/vendors", "Fornecedores"], ["/team", "Equipa"]] },
  { label: "Convite", tabs: [["/design", "Design"], ["/content", "Conteúdo"], ["/gifts", "Presentes"], ["/settings", "Definições"]] },
  { label: "Convidados", tabs: [["/guests", "Convidados"], ["/tables", "Mesas"], ["/guestbook", "Mensagens"], ["/checkin", "Check-in"]] },
];

export function EventTabs({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/events/${eventId}`;
  return (
    <nav className="flex flex-wrap gap-x-6 gap-y-2 border-b border-brand-200/70 text-sm">
      {GROUPS.map((g) => (
        <div key={g.label} className="flex items-center gap-1 overflow-x-auto">
          <span className="mr-1 hidden text-[0.6rem] uppercase tracking-[0.15em] text-[#a08196] sm:inline">{g.label}</span>
          {g.tabs.map(([suffix, label]) => {
            const href = base + suffix;
            const active = suffix === "" ? pathname === base : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`-mb-px whitespace-nowrap border-b-2 px-2.5 py-2 ${active ? "border-brand-700 font-semibold text-brand-700" : "border-transparent text-[#8c7b87] hover:text-brand-700"}`}>
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
