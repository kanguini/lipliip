import type { TemplateProps } from "./types";
import { CoverImage, DateLine, Greeting, eventKicker } from "./shared";

export function ClassicTemplate({ event, guestName, children }: TemplateProps) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="invite-card border-2 px-6 py-12 text-center" style={{ background: "rgba(255,255,255,0.75)" }}>
        <Greeting guestName={guestName} />
        <p className="invite-accent mt-6 text-xs font-semibold uppercase tracking-[0.35em]">{eventKicker(event)}</p>
        <h1 className="mt-4 text-4xl leading-tight [overflow-wrap:anywhere] text-balance sm:text-6xl">{event.hostNames}</h1>
        <div className="invite-divider" />
        {event.message && <p className="mx-auto max-w-md italic leading-relaxed opacity-90">{event.message}</p>}
        <CoverImage src={event.coverImageUrl} alt={event.title} className="mx-auto mt-8 h-72 w-full rounded-xl" />
        <DateLine event={event} className="invite-heading mt-8 text-2xl" />
        <p className="mt-2 text-lg">{event.venueName}</p>
        {event.venueAddress && <p className="text-sm opacity-70">{event.venueAddress}</p>}
      </div>
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}
