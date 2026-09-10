import type { TemplateProps } from "./types";
import { InvitationArt } from "./InvitationArt";
import { Greeting, eventKicker } from "./shared";
import { formatEventDate, formatTime } from "@/lib/format";
import { getTemplate } from "@/lib/templates";

/** Templates da colecção 2026: o cartaz é o cabeçalho do convite. */
export function PosterTemplate({ event, guestName, children, template }: TemplateProps) {
  const t = template ?? getTemplate(event.templateId);
  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      {/* Título de nível 1 para leitores de ecrã: o cartaz mostra os nomes como imagem/h3. */}
      <h1 className="sr-only">{eventKicker(event)} · {event.hostNames}</h1>
      <Greeting guestName={guestName} className="mb-4 text-center" />
      <InvitationArt
        templateId={event.templateId}
        template={template}
        kicker={eventKicker(event)}
        names={event.hostNames}
        dateLabel={formatEventDate(event.date, false, event.timezone)}
        placeLabel={`${event.venueName} · ${formatTime(event.date, event.timezone)}`}
        caption={event.message ? undefined : t.sample.caption}
        coverImageUrl={event.coverImageUrl}
        className="mx-auto max-w-md shadow-2xl"
      />
      {event.message && <p className="invite-heading mx-auto mt-8 max-w-md text-center text-lg italic leading-relaxed opacity-90">{event.message}</p>}
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}
