"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck, ConciergeBell, Eye, Gift, Images, LayoutGrid, ListChecks, MessageSquare, Palette, ScanLine, Settings, Store, Type, Users, UsersRound, Wallet, type LucideIcon } from "lucide-react";

type Page = [suffix: string, label: string, icon?: LucideIcon];
type Area = { label: string; pages: Page[] };
const AREAS: Area[] = [
  { label: "Resumo", pages: [["", "Resumo"]] },
  { label: "Convite", pages: [["/design", "Design", Palette], ["/content", "Conteúdo", Type], ["/photos", "Fotografias", Images], ["/gifts", "Presentes", Gift], ["/preview", "Ver convite", Eye]] },
  { label: "Convidados", pages: [["/guests", "Lista e envio", Users], ["/tables", "Mesas", LayoutGrid], ["/guestbook", "Mensagens", MessageSquare], ["/requests", "Pedidos", ConciergeBell], ["/checkin", "Check-in", ScanLine]] },
  { label: "Planeamento", pages: [["/tasks", "Tarefas", ListChecks], ["/budget", "Orçamento", Wallet], ["/vendors", "Fornecedores", Store]] },
  { label: "Definições", pages: [["/settings", "Evento", Settings], ["/team", "Equipa", UsersRound], ["/activate", "Ativação", BadgeCheck]] },
];

/**
 * Navegação do evento: barra principal (áreas) e, colada por baixo, um painel com as secções da área ativa.
 * O painel partilha o fundo branco da barra para se ler como parte dela e não como um menu solto.
 */
export function EventTabs({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/events/${eventId}`;
  const isActive = (suffix: string) => (suffix === "" ? pathname === base : pathname.startsWith(base + suffix));
  const activeArea = AREAS.find((a) => a.pages.some(([s]) => isActive(s))) ?? AREAS[0];
  const hasSections = activeArea.pages.length > 1;
  return (
    <div className={`bg-white shadow-[0_2px_16px_rgba(84,27,56,0.06)] ${hasSections ? "rounded-[1.75rem]" : "rounded-full"}`}>
      <nav className="flex gap-1 overflow-x-auto p-1.5" aria-label="Áreas do evento">
        {AREAS.map((a) => {
          const active = a === activeArea;
          return (
            <Link key={a.label} href={base + a.pages[0][0]} aria-current={active ? "page" : undefined} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${active ? "bg-brand-700 text-white shadow-[0_6px_18px_rgba(84,27,56,0.22)]" : "text-brand-800 hover:bg-brand-100"}`}>
              {a.label}
            </Link>
          );
        })}
      </nav>
      {hasSections && (
        <div className="flex items-center gap-3 border-t border-brand-100 px-3 py-2">
          <span className="eyebrow hidden flex-none pl-1 sm:block">Secções de {activeArea.label}</span>
          <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto" aria-label={`Secções de ${activeArea.label}`}>
            {activeArea.pages.map(([suffix, label, Icon]) => {
              const active = isActive(suffix);
              return (
                <Link key={suffix} href={base + suffix} aria-current={active ? "page" : undefined} className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-[0.8125rem] transition ${active ? "bg-brand-100 font-semibold text-brand-700" : "text-brand-800/80 hover:bg-brand-50 hover:text-brand-800"}`}>
                  {Icon && <Icon className={`h-4 w-4 ${active ? "text-brand-700" : "text-brand-500"}`} strokeWidth={1.75} aria-hidden />}
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
