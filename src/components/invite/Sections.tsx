import { daysUntil, formatDateTimeShort, formatEventDate, formatTime } from "@/lib/format";
import type { ProgramItem } from "@/lib/event-types";
import type { TemplateEvent } from "@/components/templates/types";

export function DetailsSection({ event, calendarUrl }: { event: TemplateEvent; calendarUrl?: string }) {
  const days = daysUntil(event.date);
  const mapsUrl =
    event.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([event.venueName, event.venueAddress].filter(Boolean).join(", "))}`;
  return (
    <section className="invite-card">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-widest opacity-60">Data e hora</p>
          <p className="mt-1 font-semibold">{formatEventDate(event.date)}</p>
          <p className="text-sm">{formatTime(event.date)}{event.endTime ? ` – ${event.endTime}` : ""}</p>
          {days > 0 && <p className="invite-accent mt-1 text-sm font-semibold">Faltam {days} {days === 1 ? "dia" : "dias"}!</p>}
          {days === 0 && <p className="invite-accent mt-1 text-sm font-semibold">É hoje!</p>}
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
