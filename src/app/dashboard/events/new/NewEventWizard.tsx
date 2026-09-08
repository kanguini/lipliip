"use client";

import { useState } from "react";
import { EVENT_TYPES, type EventType } from "@/lib/event-types";
import { templatesForType } from "@/lib/templates";
import { createEventAction } from "@/app/dashboard/actions";

export function NewEventWizard({ detailsFields }: { detailsFields: Record<string, React.ReactNode> }) {
  const [type, setType] = useState<EventType>("WEDDING");
  const [templateId, setTemplateId] = useState("classic");
  const [step, setStep] = useState(1);
  const templates = templatesForType(type);
  const effectiveTemplate = templates.some((t) => t.id === templateId) ? templateId : templates[0].id;

  return (
    <form action={createEventAction} className="space-y-8">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="templateId" value={effectiveTemplate} />

      <ol className="flex gap-4 text-sm">
        {["Tipo de evento", "Template", "Detalhes"].map((label, i) => (
          <li key={label} className={`flex items-center gap-2 ${step === i + 1 ? "font-semibold text-brand-700" : "text-stone-400"}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step >= i + 1 ? "bg-brand-600 text-white" : "bg-stone-200"}`}>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <section className={step === 1 ? "" : "hidden"}>
        <h2 className="text-lg font-semibold">Que evento vai celebrar?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {(Object.keys(EVENT_TYPES) as EventType[]).map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => setType(k)}
              className={`card text-left transition ${type === k ? "border-brand-500 ring-2 ring-brand-200" : "hover:border-stone-400"}`}
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
        <h2 className="text-lg font-semibold">Escolha o template</h2>
        <p className="text-sm text-stone-500">Pode mudar mais tarde e personalizar a cor.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setTemplateId(t.id)}
              className={`overflow-hidden rounded-xl border text-left transition ${effectiveTemplate === t.id ? "border-brand-500 ring-2 ring-brand-200" : "border-stone-200 hover:border-stone-400"}`}
            >
              <div className="flex h-36 flex-col items-center justify-center p-4 text-center" style={{ background: t.colors.bg, color: t.colors.text }}>
                <span style={{ fontFamily: t.fontHeading, color: t.colors.accent }} className="text-3xl">{EVENT_TYPES[type].hostPlaceholder}</span>
                <span className="mt-1 text-xs opacity-70">sábado, 14 de junho</span>
              </div>
              <div className="bg-white p-3">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="mt-1 text-xs text-stone-500">{t.description}</p>
                <a href={`/preview/${t.id}`} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-brand-700 underline" onClick={(e) => e.stopPropagation()}>Pré-visualizar ↗</a>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-6 flex justify-between">
          <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Voltar</button>
          <button type="button" className="btn-primary" onClick={() => setStep(3)}>Continuar</button>
        </div>
      </section>

      <section className={step === 3 ? "" : "hidden"}>
        <h2 className="text-lg font-semibold">Detalhes do evento</h2>
        <div className="mt-4">{detailsFields[type]}</div>
        <div className="mt-6 flex justify-between">
          <button type="button" className="btn-secondary" onClick={() => setStep(2)}>Voltar</button>
          <button className="btn-primary">Criar evento</button>
        </div>
      </section>
    </form>
  );
}
