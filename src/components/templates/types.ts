import type { ReactNode } from "react";
import type { TemplateMeta } from "@/lib/templates";

/** Subconjunto do evento necessário para desenhar o convite (usado também nas pré-visualizações). */
export type TemplateEvent = {
  type: string;
  templateId: string;
  title: string;
  hostNames: string;
  message: string | null;
  date: Date;
  endTime: string | null;
  venueName: string;
  venueAddress: string | null;
  mapsUrl: string | null;
  /** Coordenadas escolhidas no mapa (opcionais; os exemplos dos templates não as têm). */
  venueLat?: number | null;
  venueLng?: number | null;
  dressCode: string | null;
  coverImageUrl: string | null;
  accentColor: string | null;
  timezone: string;
};

export type TemplateProps = {
  event: TemplateEvent;
  guestName?: string;
  children?: ReactNode;
  /** Meta já resolvida (necessária para templates personalizados). */
  template?: TemplateMeta;
};
