import type { ReactNode } from "react";

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
  dressCode: string | null;
  coverImageUrl: string | null;
  accentColor: string | null;
  timezone: string;
};

export type TemplateProps = {
  event: TemplateEvent;
  guestName?: string;
  children?: ReactNode;
};
