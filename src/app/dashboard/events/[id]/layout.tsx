import Link from "next/link";
import { requireEventAccess } from "@/lib/access";
import { eventTypeLabel } from "@/lib/event-types";
import { formatEventDate, formatTime } from "@/lib/format";
import { EventTabs } from "./tabs";
import { ChevronLeft, Eye } from "lucide-react";

export default async function EventLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { event, role } = await requireEventAccess(id, { allowStaff: true });
  return (
    <>
      <Link href="/dashboard" className="mb-3 inline-flex items-center gap-1 text-sm text-[#8c7b87] hover:text-brand-700"><ChevronLeft className="h-4 w-4" aria-hidden />Os meus eventos</Link>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">{eventTypeLabel(event.type)}</span>
          <h1 className="display-title mt-1 text-3xl">{event.title}</h1>
          <p className="text-sm text-[#8c7b87]">{formatEventDate(event.date, true, event.timezone)} · {formatTime(event.date, event.timezone)} · {event.venueName}</p>
        </div>
        <Link href={`/dashboard/events/${event.id}/preview`} className="btn-secondary btn-sm"><Eye className="h-4 w-4" aria-hidden />Ver convite</Link>
      </div>
      {role === "STAFF" ? <p className="pb-2 text-sm text-muted">Acesso de receção: <Link href={`/dashboard/events/${event.id}/checkin`} className="underline">check-in no dia do evento</Link>.</p> : <EventTabs eventId={event.id} />}
      <div className="mt-6">{children}</div>
    </>
  );
}
