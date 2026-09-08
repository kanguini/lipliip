import Link from "next/link";
import { requireOwnedEvent } from "@/lib/auth";
import { eventTypeLabel } from "@/lib/event-types";
import { formatEventDate } from "@/lib/format";
import { EventTabs } from "./tabs";

export default async function EventLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { event } = await requireOwnedEvent(id);
  return (
    <>
      <Link href="/dashboard" className="mb-3 inline-block text-sm text-stone-500 hover:text-stone-900">← Os meus eventos</Link>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="badge bg-stone-100 text-stone-700">{eventTypeLabel(event.type)}</span>
          <h1 className="mt-1 text-2xl font-semibold">{event.title}</h1>
          <p className="text-sm text-stone-500">{formatEventDate(event.date)} · {event.venueName}</p>
        </div>
        <Link href={`/dashboard/events/${event.id}/preview`} className="btn-secondary btn-sm">👁 Ver convite</Link>
      </div>
      <EventTabs eventId={event.id} />
      <div className="mt-6">{children}</div>
    </>
  );
}
