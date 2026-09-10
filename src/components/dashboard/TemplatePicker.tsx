import { InvitationArt } from "@/components/templates/InvitationArt";
import { EVENT_TYPES, type EventType } from "@/lib/event-types";
import type { TemplateMeta } from "@/lib/templates";

/** Selo "Premium" mostrado nos templates reservados a eventos ativados. */
export function PremiumPill({ className = "" }: { className?: string }) {
  return <span className={`badge bg-joy-sun/60 text-brand-900 ${className}`}>Premium</span>;
}

/**
 * Cartão de template (cartaz para a colecção 2026, amostra de cores para os clássicos). Serve como <label> de um radio ou como botão.
 * Aceita o template já cruzado com as definições da administração (premium/enabled); sem elas comporta-se como antes.
 */
export function TemplateCard({ t, type, names, selected }: { t: TemplateMeta & { premium?: boolean; enabled?: boolean }; type: string; names?: string; selected: boolean }) {
  const kicker = EVENT_TYPES[type as EventType]?.label ?? "Evento";
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-white transition ${selected ? "border-brand-500 ring-2 ring-brand-200" : "border-brand-200/70 hover:border-brand-300"}`}>
      {t.premium && <PremiumPill className="absolute left-2 top-2 z-10 shadow-sm" />}
      {t.collection === "2026" ? (
        <InvitationArt templateId={t.id} template={t} kicker={kicker} names={names || t.sample.names} dateLabel="12 de dezembro de 2026" placeLabel="Local do evento · 16:00" caption={t.sample.caption} className="rounded-none" />
      ) : (
        <div className="flex aspect-[4/5] flex-col items-center justify-center p-4 text-center" style={{ background: t.colors.bg, color: t.colors.text }}>
          <span className="text-xs uppercase tracking-[0.2em] opacity-70">{kicker}</span>
          <span style={{ fontFamily: t.fontHeading, color: t.colors.accent }} className="mt-3 text-3xl">{names || t.sample.names}</span>
          <span className="mt-2 text-xs opacity-70">12 de dezembro de 2026</span>
        </div>
      )}
      <div className="p-3">
        <p className="text-sm font-semibold">{t.name}</p>
        <p className="text-xs text-muted">{t.tag}{t.enabled === false ? " · indisponível" : ""}</p>
      </div>
    </div>
  );
}
