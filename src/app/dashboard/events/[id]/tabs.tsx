"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Area = { label: string; pages: [string, string][] };
const AREAS: Area[] = [
  { label: "Resumo", pages: [["", "Resumo"]] },
  { label: "Convite", pages: [["/design", "Design"], ["/content", "Conteúdo"], ["/gifts", "Presentes"], ["/preview", "Ver convite"]] },
  { label: "Convidados", pages: [["/guests", "Lista e envio"], ["/tables", "Mesas"], ["/guestbook", "Mensagens"], ["/checkin", "Check-in"]] },
  { label: "Planeamento", pages: [["/tasks", "Tarefas"], ["/budget", "Orçamento"], ["/vendors", "Fornecedores"]] },
  { label: "Definições", pages: [["/settings", "Evento"], ["/team", "Equipa"]] },
];

export function EventTabs({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/events/${eventId}`;
  const isActive = (suffix: string) => (suffix === "" ? pathname === base : pathname.startsWith(base + suffix));
  const activeArea = AREAS.find((a) => a.pages.some(([s]) => isActive(s))) ?? AREAS[0];
  return (
    <div className="space-y-3">
      <nav className="flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-[0_2px_16px_rgba(84,27,56,0.06)]">
        {AREAS.map((a) => {
          const active = a === activeArea;
          return (
            <Link key={a.label} href={base + a.pages[0][0]} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${active ? "bg-brand-700 text-white" : "text-brand-800 hover:bg-brand-100"}`}>
              {a.label}
            </Link>
          );
        })}
      </nav>
      {activeArea.pages.length > 1 && (
        <nav className="flex flex-wrap gap-1 px-1">
          {activeArea.pages.map(([suffix, label]) => (
            <Link key={suffix} href={base + suffix} className={`rounded-full px-3 py-1 text-xs transition ${isActive(suffix) ? "bg-brand-100 font-semibold text-brand-700" : "text-muted hover:bg-brand-50"}`}>
              {label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
