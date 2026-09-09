import { getGuestByToken, isGuestAuthorized } from "@/lib/guest-access";
import { buildIcs } from "@/lib/ics";
import { inviteUrl } from "@/lib/urls";
import { eventEnd } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const guest = await getGuestByToken(token);
  if (!guest) return new Response("Not found", { status: 404 });
  if (!(await isGuestAuthorized(guest, guest.event))) return new Response("Forbidden", { status: 403 });
  const e = guest.event;
  const ics = buildIcs({
    uid: `${e.id}-${guest.id}@lipliip`,
    title: e.title,
    description: e.message ?? undefined,
    location: [e.venueName, e.venueAddress].filter(Boolean).join(", "),
    start: e.date,
    end: eventEnd(e.date, e.endTime, e.timezone),
    url: inviteUrl(token),
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="convite.ics"`,
    },
  });
}
