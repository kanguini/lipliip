"use client";

import { useState } from "react";
import { EVENT_TYPES, type EventType } from "@/lib/event-types";
import { DEFAULT_TEMPLATE_ID, templatesForType, type TemplateMeta } from "@/lib/templates";
import { DEFAULT_COUNTRY, SUPPORTED_COUNTRIES } from "@/lib/phone";
import { DEFAULT_CURRENCY } from "@/lib/format";
import { createEventAction } from "@/app/dashboard/actions";
import { TemplateCard } from "@/components/dashboard/TemplatePicker";
import { InvitationArt } from "@/components/templates/InvitationArt";
import { EventIcon } from "@/components/ui/EventIcon";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { SubmitButton } from "@/components/dashboard/SubmitButton";

type Draft = { hostNames: string; date: string; venueName: string; message: string };

function dateLabel(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return "Data a definir";
  return new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", year: "numeric" }).format(new Date(+m[1], +m[2] - 1, +m[3]));
}

const STEPS = ["A ocasião", "O modelo", "O essencial"];

type WizardTemplate = TemplateMeta & { premium?: boolean };

/** `templates`: lista já filtrada pela administração (templates ativos, com o selo premium); sem ela usa o catálogo completo. */
export function NewEventWizard({ initialType, initialTemplate, templates: catalog }: { initialType?: string; initialTemplate?: string; templates?: WizardTemplate[] }) {
  const validType = (initialType && initialType in EVENT_TYPES ? initialType : "WEDDING") as EventType;
  const [type, setType] = useState<EventType>(validType);
  const [templateId, setTemplateId] = useState(initialTemplate || DEFAULT_TEMPLATE_ID);
  const [step, setStep] = useState(initialTemplate ? 3 : 1);
  const [draft, setDraft] = useState<Draft>({ hostNames: "", date: "", venueName: "", message: "" });
  const templates: WizardTemplate[] = catalog ? catalog.filter((t) => t.types.includes(type)) : templatesForType(type);
  const effectiveTemplate = templates.some((t) => t.id === templateId) ? templateId : (templates[0]?.id ?? templatesForType(type)[0].id);
  const kind = EVENT_TYPES[type];

  function onInput(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    setDraft({ hostNames: String(fd.get("hostNames") ?? ""), date: String(fd.get("date") ?? ""), venueName: String(fd.get("venueName") ?? ""), message: String(fd.get("message") ?? "") });
  }

  return (
    <form action={createEventAction} onInput={onInput} className="space-y-8">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="templateId" value={effectiveTemplate} />

      <ol className="flex flex-wrap items-center gap-3 text-sm">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = step === n ? "current" : step > n ? "done" : "todo";
          return (
            <li key={label} className="flex items-center gap-2">
              <button type="button" onClick={() => n < step && setStep(n)} className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${state === "current" ? "bg-brand-700 text-white" : state === "done" ? "bg-joy-sage text-brand-900" : "bg-brand-100 text-brand-400"}`} aria-label={`Passo ${n}`}>
                {state === "done" ? <Check className="h-4 w-4" aria-hidden /> : n}
              </button>
              <span className={state === "current" ? "font-semibold text-brand-700" : "text-muted"}>{label}</span>
              {n < STEPS.length && <span className="mx-1 h-px w-6 bg-brand-200" aria-hidden />}
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <section>
          <h2 className="display-title text-3xl">Que momento vai <em>celebrar</em>?</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {(Object.keys(EVENT_TYPES) as EventType[]).map((k) => (
              <button type="button" key={k} onClick={() => { setType(k); setStep(2); }} className={`card flex flex-col items-start gap-3 text-left transition hover:-translate-y-0.5 ${type === k ? "ring-2 ring-brand-400" : ""}`}>
                <span className="icon-circle bg-brand-100"><EventIcon type={k} className="h-6 w-6 text-brand-700" /></span>
                <span className="font-semibold">{EVENT_TYPES[k].label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2 className="display-title text-3xl">Escolha como <em>começa</em>.</h2>
          <p className="mt-1 text-sm text-muted">Pode mudar mais tarde e personalizar cor e foto.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <button type="button" key={t.id} onClick={() => { setTemplateId(t.id); setStep(3); }} className="text-left">
                <TemplateCard t={t} type={type} selected={effectiveTemplate === t.id} />
              </button>
            ))}
          </div>
          <div className="mt-6"><button type="button" className="btn-ghost" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" aria-hidden />Voltar</button></div>
        </section>
      )}

      {step === 3 && (
        <section className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
          <div className="space-y-5">
            <h2 className="display-title text-3xl">Só o <em>essencial</em>.</h2>
            <p className="-mt-3 text-sm text-muted">Programa, lista de presentes e o resto ficam para depois, quando quiser.</p>
            <div>
              <label className="label" htmlFor="hostNames">{kind.hostLabel}</label>
              <input id="hostNames" name="hostNames" className="input" required minLength={1} maxLength={120} placeholder={kind.hostPlaceholder} autoFocus />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="date">Data e hora</label>
                <input id="date" name="date" type="datetime-local" className="input" required />
              </div>
              <div>
                <label className="label" htmlFor="venueName">Local</label>
                <input id="venueName" name="venueName" className="input" required minLength={2} maxLength={120} placeholder="Quinta da Serra, Sintra" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="message">Mensagem de abertura <span className="font-normal text-muted">(opcional)</span></label>
              <textarea id="message" name="message" className="input" rows={3} placeholder="Com muita alegria convidamos-te para celebrar connosco…" />
            </div>
            <div>
              <label className="label" htmlFor="country">País por omissão dos telefones</label>
              <select id="country" name="country" className="input" defaultValue={DEFAULT_COUNTRY}>{SUPPORTED_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}</select>
              <p className="hint">Números de outros países: escreva com o indicativo, ex.: +351 912 345 678</p>
            </div>
            <input type="hidden" name="currency" value={DEFAULT_CURRENCY} />
            <div className="flex items-center justify-between pt-2">
              <button type="button" className="btn-ghost" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4" aria-hidden />Voltar</button>
              <SubmitButton pendingText="A criar…">Criar convite <ArrowRight className="h-4 w-4" aria-hidden /></SubmitButton>
            </div>
          </div>
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl bg-brand-100 p-5">
              <p className="mb-4 text-center text-[0.65rem] font-semibold uppercase tracking-[0.13em] text-brand-500">O seu convite</p>
              <InvitationArt templateId={effectiveTemplate} kicker={kind.label} names={draft.hostNames || kind.hostPlaceholder} dateLabel={dateLabel(draft.date)} placeLabel={draft.venueName || "Local do evento"} caption={draft.message ? undefined : "O convite adapta-se ao telemóvel."} className="shadow-xl" />
              {draft.message && <p className="mt-4 text-center text-xs italic text-muted">{draft.message.slice(0, 160)}{draft.message.length > 160 ? "…" : ""}</p>}
            </div>
          </aside>
        </section>
      )}
    </form>
  );
}
