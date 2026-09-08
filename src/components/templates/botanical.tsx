import type { TemplateProps } from "./types";
import { CoverImage, DateLine, Greeting, eventKicker } from "./shared";

function Leaf({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden fill="currentColor">
      <path d="M50 5C25 25 15 55 20 95c35-5 60-30 65-70C70 20 60 10 50 5Zm-3 20c-2 25-8 45-20 62 15-10 25-30 30-60l-10-2Z" />
    </svg>
  );
}

export function BotanicalTemplate({ event, guestName, children }: TemplateProps) {
  return (
    <div className="relative mx-auto max-w-2xl overflow-hidden px-5 py-10">
      <Leaf className="invite-accent pointer-events-none absolute -left-10 -top-10 h-56 w-56 opacity-20" />
      <Leaf className="invite-accent pointer-events-none absolute -bottom-10 -right-10 h-72 w-72 rotate-180 opacity-20" />
      <div className="relative text-center">
        <Greeting guestName={guestName} />
        <p className="invite-accent mt-8 text-sm uppercase tracking-[0.3em]">{eventKicker(event)}</p>
        <h1 className="mt-3 text-6xl font-semibold italic sm:text-7xl">{event.hostNames}</h1>
        {event.message && <p className="mx-auto mt-6 max-w-md leading-relaxed opacity-90">{event.message}</p>}
        <CoverImage src={event.coverImageUrl} alt={event.title} className="mx-auto mt-8 h-80 w-full rounded-t-full rounded-b-3xl" />
        <div className="invite-card mt-8">
          <DateLine event={event} className="invite-heading text-2xl" />
          <p className="mt-2 font-medium">{event.venueName}</p>
          {event.venueAddress && <p className="text-sm opacity-70">{event.venueAddress}</p>}
        </div>
      </div>
      <div className="relative mt-8 space-y-6">{children}</div>
    </div>
  );
}
