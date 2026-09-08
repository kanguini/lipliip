import { formatEventDate, formatTime } from "@/lib/format";
import { EVENT_TYPES, type EventType } from "@/lib/event-types";
import type { TemplateEvent } from "./types";

export function eventKicker(event: TemplateEvent) {
  const t = EVENT_TYPES[event.type as EventType];
  if (event.type === "WEDDING") return "Vamos casar";
  if (event.type === "ENGAGEMENT") return "Ficámos noivos";
  if (event.type === "BIRTHDAY") return "Festa de aniversário";
  return t?.label ?? "Convite";
}

export function Greeting({ guestName, className = "" }: { guestName?: string; className?: string }) {
  if (!guestName) return null;
  return <p className={`text-sm tracking-wide opacity-80 ${className}`}>Convite pessoal para <strong>{guestName}</strong></p>;
}

export function DateLine({ event, className = "" }: { event: TemplateEvent; className?: string }) {
  return (
    <p className={className}>
      {formatEventDate(event.date, true, event.timezone)} · {formatTime(event.date, event.timezone)}
      {event.endTime ? ` – ${event.endTime}` : ""}
    </p>
  );
}

export function CoverImage({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={`object-cover ${className}`} />;
}
