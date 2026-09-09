"use client";

import { useState } from "react";
import { EVENT_TYPES, type EventType } from "@/lib/event-types";
import { DEFAULT_TEMPLATE_ID, templatesForType } from "@/lib/templates";
import { createEventAction } from "@/app/dashboard/actions";
import { TemplateCard } from "@/components/dashboard/TemplatePicker";
import { InvitationArt } from "@/components/templates/InvitationArt";

type Draft = { hostNames: string; date: string; venueName: string; message: string };

function dateLabel(value: string) {
  if (!value) return "Data a definir";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return "Data a definir";
  return new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", year: "numeric" }).format(new Date(+m[1], +m[2] - 1, +m[3]));
}

export function NewEventWizard({ detailsFields }: { detailsFields: Record<string, React.ReactNode> }) {
  const [type, setType] = useState<EventType>("WEDDING");
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>({ hostNames: "", date: "", venueName: "", message: "" });
  const templates = templatesForType(type);
  const effectiveTemplate = templates.some((t) => t.id === templateId) ? templateId : templates[0].id;
  const kicker = EVENT_TYPES[type].label;

  function onInput(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    setDraft({
      hostNames: String(fd.get("hostNames") ?? ""),
      date: String(fd.get("date") ?? ""),
      venueName: String(fd.get("venueName") ?? ""),
      message: String(fd.get("message") ?? ""),
    });
  }

  return (
    <form action={createEventAction} onInput={onInput} className="space-y-8">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="templateId" value={effectiveTemplate} />

      <ol className="flex flex-wrap gap-4 text-sm">
        {["A ocasião", "O convite", "Os detalhes"].map((label, i) => (
          <li key={label} className={`flex items-center gap-2 ${step === i + 1 ? "font-semibold text-brand-700" : "text-[#a1939c]"}`}>
            <span className={`font-display text-lg ${step >= i + 1 ? "text-brand-400" : "text-[#cfbac5]"}`}>0{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <section className={step === 1 ? "" : "hidden"}>
        <p className="eyebrow">Passo 1</p>
        <h2 className="display-title mt-2 text-3xl">Que momento vai celebrar<span className="plum">?</span></h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {(Object.keys(EVENT_TYPES) as EventType[]).map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => setType(k)}
              className={`card text-left transition ${type === k ? "border-brand-500 ring-2 ring-brand-200" : "hover:border-brand-300"}`}
            >
              <span className="text-3xl">{EVENT_TYPES[k].emoji}</span>
              <p className="mt-2 font-semibold">{EVENT_TYPES[k].label}</p>
            </button>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button type="button" className="btn-primary" onClick={() => setStep(2)}>Continuar</button>
        </div>
      </section>

      <section className={step === 2 ? "" : "hidden"}>
        <p className="eyebrow">Passo 2</p>
        <h2 className="display-title mt-2 text-3xl">Escolha como começa<span className="plum">.</span></h2>
        <p className="mt-1 text-sm text-[#8c7b87]">Pode mudar mais tarde e personalizar a cor e a foto.</p>
        {(["2026", "classic"] as const).map((collection) => {
          const list = templates.filter((t) => t.collection === collection);
          if (!list.length) return null;
          return (
            <div key={collection} className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#a08196]">{collection === "2026" ? "Colecção 2026" : "Clássicos"}</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((t) => (
                  <button type="button" key={t.id} onClick={() => setTemplateId(t.id)} className="text-left">
                    <TemplateCard t={t} type={type} selected={effectiveTemplate === t.id} />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        <div className="mt-6 flex justify-between">
          <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Voltar</button>
          <button type="button" className="btn-primary" onClick={() => setStep(3)}>Continuar</button>
        </div>
      </section>

      <section className={step === 3 ? "" : "hidden"}>
        <p className="eyebrow">Passo 3</p>
        <h2 className="display-title mt-2 text-3xl">Os detalhes contam<span className="plum">.</span></h2>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>{detailsFields[type]}</div>
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-xl bg-brand-100 p-5">
              <p className="mb-4 text-center text-[0.65rem] font-semibold uppercase tracking-[0.13em] text-[#a08196]">O seu convite</p>
              <InvitationArt
                templateId={effectiveTemplate}
                kicker={kicker}
                names={draft.hostNames || EVENT_TYPES[type].hostPlaceholder}
                dateLabel={dateLabel(draft.date)}
                placeLabel={draft.venueName || "Local do evento"}
                caption={draft.message ? undefined : "O convite adapta-se ao telemóvel."}
                className="shadow-xl"
              />
              {draft.message && <p className="mt-4 text-center text-xs italic text-[#8c7b87]">{draft.message.slice(0, 160)}{draft.message.length > 160 ? "…" : ""}</p>}
            </div>
          </aside>
        </div>
        <div className="mt-6 flex justify-between">
          <button type="button" className="btn-secondary" onClick={() => setStep(2)}>Voltar</button>
          <button className="btn-primary">Criar evento</button>
        </div>
      </section>
    </form>
  );
}
