import { daysUntil, formatDateTimeShort, formatEventDate, formatTime } from "@/lib/format";
import type { PartyMember, ProgramItem, StoryItem } from "@/lib/event-types";
import { Countdown } from "./Countdown";
import type { TemplateEvent } from "@/components/templates/types";

export function DetailsSection({ event, calendarUrl, googleUrl }: { event: TemplateEvent; calendarUrl?: string; googleUrl?: string }) {
  const days = daysUntil(event.date);
  const mapsUrl =
    event.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([event.venueName, event.venueAddress].filter(Boolean).join(", "))}`;
  return (
    <section className="invite-card">
      {days >= 0 && (
        <div className="mb-5">
          <Countdown date={event.date.toISOString()} />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-widest opacity-60">Data e hora</p>
          <p className="mt-1 font-semibold">{formatEventDate(event.date)}</p>
          <p className="text-sm">{formatTime(event.date)}{event.endTime ? ` – ${event.endTime}` : ""}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest opacity-60">Local</p>
          <p className="mt-1 font-semibold">{event.venueName}</p>
          {event.venueAddress && <p className="text-sm">{event.venueAddress}</p>}
        </div>
        {event.dressCode && (
          <div>
            <p className="text-xs uppercase tracking-widest opacity-60">Dress code</p>
            <p className="mt-1 font-semibold">{event.dressCode}</p>
          </div>
        )}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="invite-btn-outline btn-sm">📍 Ver no mapa</a>
        {calendarUrl && <a href={calendarUrl} className="invite-btn-outline btn-sm">📅 Adicionar ao calendário</a>}
        {googleUrl && <a href={googleUrl} target="_blank" rel="noreferrer" className="invite-btn-outline btn-sm">Google Calendar</a>}
        <a href="#rsvp" className="invite-btn btn-sm">Confirmar presença</a>
      </div>
    </section>
  );
}

export function ProgramSection({ items }: { items: ProgramItem[] }) {
  if (!items.length) return null;
  return (
    <section className="invite-card">
      <h2 className="text-2xl">Programa</h2>
      <ol className="mt-4 space-y-3">
        {items.map((p, i) => (
          <li key={i} className="flex gap-4">
            <span className="invite-accent w-14 flex-none font-semibold">{p.time}</span>
            <div>
              <p className="font-semibold">{p.title}</p>
              {p.description && <p className="text-sm opacity-75">{p.description}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function GuestbookSection({ entries, children }: { entries: { id: string; name: string; message: string; createdAt: Date }[]; children: React.ReactNode }) {
  return (
    <section className="invite-card">
      <h2 className="text-2xl">Livro de mensagens</h2>
      {entries.length > 0 && (
        <ul className="mt-4 space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="rounded-lg p-3 text-sm" style={{ background: "color-mix(in srgb, var(--inv-accent) 8%, transparent)" }}>
              <p className="italic">“{e.message}”</p>
              <p className="mt-1 text-xs opacity-60">— {e.name}, {formatDateTimeShort(e.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
      {children}
    </section>
  );
}

export function CheckinSection({ qrDataUrl, code, checkedInAt }: { qrDataUrl: string; code: string; checkedInAt: Date | null }) {
  return (
    <section className="invite-card text-center">
      <h2 className="text-2xl">O seu bilhete de entrada</h2>
      <p className="mt-1 text-sm opacity-70">No dia do evento, mostre este código à entrada. É pessoal e válido para uma única entrada.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrDataUrl} alt="QR code de entrada" className="mx-auto mt-4 h-44 w-44 rounded-lg bg-white p-2" />
      <p className="mt-2 font-mono text-2xl font-bold tracking-[0.3em]">{code}</p>
      {checkedInAt && <p className="mt-2 text-sm font-medium">Entrada registada em {formatDateTimeShort(checkedInAt)}.</p>}
    </section>
  );
}

export function GallerySection({ images }: { images: string[] }) {
  if (!images.length) return null;
  return (
    <section className="invite-card">
      <h2 className="text-2xl">Galeria</h2>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((src, i) => (
          <a key={i} href={src} target="_blank" rel="noreferrer" className={i === 0 ? "col-span-2 row-span-2" : ""}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" loading="lazy" className="h-full w-full rounded-lg object-cover" style={{ aspectRatio: "1 / 1" }} />
          </a>
        ))}
      </div>
    </section>
  );
}

export function StorySection({ items, title }: { items: StoryItem[]; title: string }) {
  if (!items.length) return null;
  return (
    <section className="invite-card">
      <h2 className="text-2xl">{title}</h2>
      <ol className="relative mt-4 space-y-6 border-l pl-5" style={{ borderColor: "color-mix(in srgb, var(--inv-accent) 40%, transparent)" }}>
        {items.map((s, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full" style={{ background: "var(--inv-accent)" }} />
            {s.date && <p className="invite-accent text-xs font-semibold uppercase tracking-widest">{s.date}</p>}
            <p className="invite-heading text-lg font-semibold">{s.title}</p>
            {s.text && <p className="mt-1 text-sm opacity-85">{s.text}</p>}
            {s.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.imageUrl} alt="" loading="lazy" className="mt-2 h-44 w-full rounded-lg object-cover" />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function PartySection({ members, title }: { members: PartyMember[]; title: string }) {
  if (!members.length) return null;
  return (
    <section className="invite-card">
      <h2 className="text-2xl">{title}</h2>
      <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {members.map((m, i) => (
          <li key={i} className="text-center">
            {m.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.imageUrl} alt={m.name} loading="lazy" className="mx-auto h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="invite-heading mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl" style={{ background: "color-mix(in srgb, var(--inv-accent) 15%, transparent)" }}>
                {m.name.charAt(0)}
              </div>
            )}
            <p className="mt-2 text-sm font-semibold">{m.name}</p>
            {m.role && <p className="text-xs opacity-70">{m.role}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function InfoSection({ hashtag, extraInfo }: { hashtag: string | null; extraInfo: string | null }) {
  if (!hashtag && !extraInfo) return null;
  return (
    <section className="invite-card">
      <h2 className="text-2xl">Informações úteis</h2>
      {extraInfo && (
        <div className="mt-3 space-y-2 text-sm opacity-90">
          {extraInfo.split(/\n{2,}/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
        </div>
      )}
      {hashtag && (
        <p className="mt-4 text-sm">
          Partilhe as suas fotos com <span className="invite-accent font-semibold">{hashtag.startsWith("#") ? hashtag : `#${hashtag}`}</span>
        </p>
      )}
    </section>
  );
}
