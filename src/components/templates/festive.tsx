import type { TemplateProps } from "./types";
import { CoverImage, DateLine, Greeting, eventKicker } from "./shared";

const CONFETTI_COLORS = ["#ff6b35", "#ffd23f", "#3bceac", "#0ead69", "#ee4266", "#540d6e"];

export function FestiveTemplate({ event, guestName, children }: TemplateProps) {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="confetti"
            style={{
              left: `${(i * 37) % 100}%`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animationDuration: `${6 + (i % 5)}s`,
              animationDelay: `${-(i % 7)}s`,
            }}
          />
        ))}
      </div>
      <div className="relative mx-auto max-w-2xl px-5 py-10 text-center">
        <Greeting guestName={guestName} />
        <p className="invite-accent mt-6 text-lg font-bold uppercase tracking-widest">🎉 {eventKicker(event)} 🎉</p>
        <h1 className="mt-3 text-6xl font-bold leading-none sm:text-7xl">{event.hostNames}</h1>
        {event.message && <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed">{event.message}</p>}
        <CoverImage src={event.coverImageUrl} alt={event.title} className="mx-auto mt-8 h-72 w-full rotate-[-2deg] rounded-3xl shadow-xl" />
        <div className="invite-card mt-10 rotate-[1deg]" style={{ background: "#fff" }}>
          <DateLine event={event} className="text-2xl font-bold" />
          <p className="mt-2 text-lg">{event.venueName}</p>
          {event.venueAddress && <p className="text-sm opacity-70">{event.venueAddress}</p>}
        </div>
        <div className="mt-8 space-y-6 text-left">{children}</div>
      </div>
    </div>
  );
}
