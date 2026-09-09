import type { TemplateProps } from "./types";
import { CoverImage, DateLine, Greeting, eventKicker } from "./shared";

export function NightTemplate({ event, guestName, children }: TemplateProps) {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundImage: "radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--inv-accent) 22%, transparent), transparent 60%)" }}
    >
      <div className="mx-auto max-w-2xl px-5 py-12 text-center">
        <Greeting guestName={guestName} />
        <div className="invite-accent mt-8 text-xs font-semibold uppercase tracking-[0.4em]">✦ {eventKicker(event)} ✦</div>
        <h1 className="invite-accent mt-5 text-5xl leading-tight [overflow-wrap:anywhere] text-balance sm:text-7xl">{event.hostNames}</h1>
        <div className="invite-divider" />
        {event.message && <p className="mx-auto max-w-md leading-relaxed opacity-90">{event.message}</p>}
        <CoverImage src={event.coverImageUrl} alt={event.title} className="mx-auto mt-8 h-80 w-full rounded-2xl ring-1 ring-white/10" />
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <DateLine event={event} className="invite-heading text-2xl" />
          <p className="mt-2 text-lg">{event.venueName}</p>
          {event.venueAddress && <p className="text-sm opacity-70">{event.venueAddress}</p>}
        </div>
        <div className="mt-8 space-y-6 text-left">{children}</div>
      </div>
    </div>
  );
}
