import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getAvailableTemplates } from "@/lib/templates-settings";
import { PremiumPill } from "@/components/dashboard/TemplatePicker";
import { EVENT_TYPES, type EventType } from "@/lib/event-types";
import { InvitationArt } from "@/components/templates/InvitationArt";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "Convites digitais" };

const TYPES = ["", ...Object.keys(EVENT_TYPES)] as const;

export default async function InvitesPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await requireUser();
  const { type = "" } = await searchParams;
  const list = await getAvailableTemplates(type || undefined);

  return (
    <>
      <p className="eyebrow">Convites digitais</p>
      <h1 className="display-title mt-2 text-4xl">Escolha como <em>começa</em>.</h1>
      <p className="mt-2 max-w-xl text-muted">Escolha um modelo e crie o convite em três passos curtos. Depois personaliza nomes, cores, foto e mensagem sempre que quiser.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <Link key={t} href={t ? `/dashboard/invites?type=${t}` : "/dashboard/invites"} className={`rounded-full px-4 py-1.5 text-sm transition ${type === t ? "bg-brand-700 text-white" : "bg-white text-brand-800 hover:bg-brand-100"}`}>
            {t ? EVENT_TYPES[t as EventType].label : "Todos"}
          </Link>
        ))}
      </div>

      {(["2026", "classic"] as const).map((collection) => {
        const items = list.filter((t) => t.collection === collection);
        if (!items.length) return null;
        return (
          <section key={collection} className="mt-10">
            <h2 className="font-display text-2xl">{collection === "2026" ? "Colecção 2026" : "Clássicos"}</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((t) => {
                const kind = (type || t.types[0]) as EventType;
                return (
                  <div key={t.id} className="group">
                    <Link href={`/dashboard/events/new?template=${t.id}&type=${kind}`} className="relative block overflow-hidden rounded-3xl shadow-[0_2px_24px_rgba(84,27,56,0.08)] transition group-hover:-translate-y-1 group-hover:shadow-[0_12px_32px_rgba(84,27,56,0.16)]">
                      {t.premium && <PremiumPill className="absolute left-3 top-3 z-10 shadow-sm" />}
                      {t.collection === "2026" ? (
                        <InvitationArt templateId={t.id} template={t} kicker={EVENT_TYPES[kind].label} names={t.sample.names} dateLabel="12 de dezembro de 2026" placeLabel="O seu local · 16:00" caption={t.sample.caption} className="rounded-none" />
                      ) : (
                        <div className="flex aspect-[4/5] flex-col items-center justify-center p-4 text-center" style={{ background: t.colors.bg, color: t.colors.text }}>
                          <span className="text-xs uppercase tracking-[0.2em] opacity-70">{EVENT_TYPES[kind].label}</span>
                          <span style={{ fontFamily: t.fontHeading, color: t.colors.accent }} className="mt-3 text-3xl">{t.sample.names}</span>
                          <span className="mt-2 text-xs opacity-70">12 de dezembro de 2026</span>
                        </div>
                      )}
                    </Link>
                    <div className="mt-3 flex items-center justify-between gap-3 px-1">
                      <div>
                        <p className="font-semibold">{t.name}</p>
                        <p className="text-xs text-muted">{t.tag}{t.premium ? " · Premium: disponível ao ativar o evento" : ""}</p>
                      </div>
                      <div className="flex gap-1">
                        <Link href={`/preview/${t.id}`} target="_blank" className="btn-ghost btn-sm">Ver</Link>
                        <Link href={`/dashboard/events/new?template=${t.id}&type=${kind}`} className="btn-primary btn-sm">Criar <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}
