import type { ReactNode } from "react";
import { TemplateFrame } from "./Frame";
import type { TemplateEvent } from "./types";
import { ClassicTemplate } from "./classic";
import { BotanicalTemplate } from "./botanical";
import { ModernTemplate } from "./modern";
import { FestiveTemplate } from "./festive";
import { NightTemplate } from "./night";
import { PosterTemplate } from "./poster";
import { POSTER_TEMPLATE_IDS, getTemplate, type TemplateMeta } from "@/lib/templates";

const COMPONENTS = {
  classic: ClassicTemplate,
  botanical: BotanicalTemplate,
  modern: ModernTemplate,
  festive: FestiveTemplate,
  night: NightTemplate,
} as const;

export function Invite({ event, guestName, children, template }: { event: TemplateEvent; guestName?: string; children?: ReactNode; template?: TemplateMeta }) {
  // Os personalizados (com cartaz carregado) desenham-se como os da colecção 2026.
  const isPoster = POSTER_TEMPLATE_IDS.has(event.templateId) || !!template?.image;
  const Component = isPoster ? PosterTemplate : (COMPONENTS[event.templateId as keyof typeof COMPONENTS] ?? ClassicTemplate);
  return (
    <TemplateFrame templateId={event.templateId} accentColor={event.accentColor} template={template}>
      <Component event={event} guestName={guestName} template={template}>{children}</Component>
    </TemplateFrame>
  );
}

export const SAMPLE_EVENTS: Record<string, TemplateEvent> = {
  WEDDING: {
    type: "WEDDING",
    templateId: "classic",
    title: "Casamento de Ana & João",
    hostNames: "Ana & João",
    message: "Com a bênção das nossas famílias, temos a alegria de vos convidar para celebrar connosco o dia do nosso casamento.",
    date: new Date("2027-06-14T15:00:00"),
    endTime: "02:00",
    venueName: "Quinta da Serra",
    venueAddress: "Estrada da Serra 12, Sintra",
    mapsUrl: "https://maps.google.com/?q=Quinta+da+Serra+Sintra",
    dressCode: "Formal",
    coverImageUrl: null,
    accentColor: null,
    timezone: "Europe/Lisbon",
  },
  ENGAGEMENT: {
    type: "ENGAGEMENT",
    templateId: "modern",
    title: "Noivado de Sofia & Miguel",
    hostNames: "Sofia & Miguel",
    message: "Dissemos que sim! Vem brindar connosco a este novo capítulo.",
    date: new Date("2027-03-20T19:30:00"),
    endTime: null,
    venueName: "Terraço do Rio",
    venueAddress: "Cais do Sodré, Lisboa",
    mapsUrl: null,
    dressCode: "Cocktail",
    coverImageUrl: null,
    accentColor: null,
    timezone: "Europe/Lisbon",
  },
  BIRTHDAY: {
    type: "BIRTHDAY",
    templateId: "festive",
    title: "30 anos da Maria",
    hostNames: "Maria faz 30!",
    message: "Três décadas merecem uma grande festa. Conto contigo!",
    date: new Date("2027-09-05T20:00:00"),
    endTime: null,
    venueName: "Casa da Maria",
    venueAddress: "Rua das Flores 45, Porto",
    mapsUrl: null,
    dressCode: "À vontade",
    coverImageUrl: null,
    accentColor: null,
    timezone: "Europe/Lisbon",
  },
};

export function sampleEventForTemplate(templateId: string, meta?: TemplateMeta): TemplateEvent {
  const byType: Record<string, string> = { festive: "BIRTHDAY", modern: "ENGAGEMENT", night: "BIRTHDAY", festa: "BIRTHDAY", noite: "BIRTHDAY", azul: "ENGAGEMENT", encontro: "ENGAGEMENT" };
  const m = meta ?? getTemplate(templateId);
  // Um personalizado aplica-se a vários tipos: escolhe o primeiro que declarou (ou casamento por omissão).
  const type = meta?.custom ? (meta.types[0] ?? "WEDDING") : (byType[templateId] ?? "WEDDING");
  const base = SAMPLE_EVENTS[type] ?? SAMPLE_EVENTS.WEDDING;
  return { ...base, type, templateId, hostNames: m.sample.names, title: m.sample.names };
}
