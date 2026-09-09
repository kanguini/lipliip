import type { TemplateProps } from "./types";
import { CoverImage, DateLine, Greeting, eventKicker } from "./shared";

export function ModernTemplate({ event, guestName, children }: TemplateProps) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="grid gap-6 sm:grid-cols-[1fr_2fr]">
        <div className="flex flex-col justify-between border-l-4 pl-4" style={{ borderColor: "var(--inv-accent)" }}>
          <p className="text-xs font-bold uppercase tracking-[0.3em]">{eventKicker(event)}</p>
          <div className="mt-6"><Greeting guestName={guestName} /></div>
        </div>
        <div>
          <h1 className="text-5xl font-bold leading-none tracking-tight sm:text-6xl">
            {event.hostNames.split(/\s*&\s*|\s+e\s+/i).map((n, i) => (
              <span key={i} className="block">{i > 0 && <span className="invite-accent">& </span>}{n}</span>
            ))}
          </h1>
        </div>
      </div>
      <CoverImage src={event.coverImageUrl} alt={event.title} className="mt-8 h-80 w-full rounded-3xl" />
      {event.message && <p className="mt-8 text-lg leading-relaxed">{event.message}</p>}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl p-5" style={{ background: "var(--inv-accent)", color: "var(--inv-on-accent, #fff)" }}>
          <p className="text-xs uppercase tracking-widest opacity-80">Quando</p>
          <DateLine event={event} className="mt-1 text-lg font-semibold" />
        </div>
        <div className="invite-card">
          <p className="text-xs uppercase tracking-widest opacity-60">Onde</p>
          <p className="mt-1 text-lg font-semibold">{event.venueName}</p>
          {event.venueAddress && <p className="text-sm opacity-70">{event.venueAddress}</p>}
        </div>
      </div>
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}
