import { notFound } from "next/navigation";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { getGuestByToken, isGuestAuthorized, logAccess } from "@/lib/guest-access";
import { maskPhone } from "@/lib/phone";
import { parseGallery, parseParty, parseProgram, parseStory } from "@/lib/event-types";
import { formatEventDate } from "@/lib/format";
import { buildEpcPayload } from "@/lib/epc";
import { googleCalendarUrl } from "@/lib/urls";
import { calendarDaysUntil, eventEnd } from "@/lib/timezone";
import { Invite } from "@/components/templates";
import { TemplateFrame } from "@/components/templates/Frame";
import { OtpGate } from "@/components/invite/OtpGate";
import { RsvpForm } from "@/components/invite/RsvpForm";
import { GiftList, type GiftView } from "@/components/invite/GiftList";
import { GuestbookForm } from "@/components/invite/GuestbookForm";
import { CheckinSection, DetailsSection, GallerySection, GuestbookSection, InfoSection, PartySection, ProgramSection, StorySection } from "@/components/invite/Sections";
import { Envelope } from "@/components/invite/Envelope";
import { MusicPlayer } from "@/components/invite/MusicPlayer";
import { eventKicker } from "@/components/templates/shared";
import { planForEvent } from "@/lib/platform";
import { parseMenu } from "@/lib/menu";
import { MenuSection } from "@/components/invite/MenuSection";
import { LiveGallery } from "@/components/invite/LiveGallery";
import { RequestsPanel } from "@/components/invite/RequestsPanel";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const guest = await getGuestByToken((await params).token);
  return {
    title: guest ? `Convite · ${guest.event.hostNames}` : "Convite",
    robots: { index: false, follow: false },
  };
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const guest = await getGuestByToken(token);
  if (!guest) notFound();
  const event = guest.event;

  const plan = await planForEvent(event);
  if (guest.suspendedAt || !plan.canShare) {
    const text = guest.suspendedAt
      ? "Este convite está temporariamente suspenso. Por favor fale com os anfitriões."
      : "Este convite ainda não está disponível. Os anfitriões vão libertá-lo em breve.";
    return (
      <TemplateFrame templateId={event.templateId} accentColor={event.accentColor}>
        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
          <div className="invite-card text-center">
            <p className="text-xs uppercase tracking-[0.3em] opacity-70">Convite de</p>
            <h1 className="invite-accent mt-2 text-4xl">{event.hostNames}</h1>
            <div className="invite-divider" />
            <p className="text-sm opacity-80">{text}</p>
          </div>
        </div>
      </TemplateFrame>
    );
  }

  if (!(await isGuestAuthorized(guest, event))) {
    return (
      <TemplateFrame templateId={event.templateId} accentColor={event.accentColor}>
        <OtpGate token={token} guestName={guest.name} hostNames={event.hostNames} maskedPhone={maskPhone(guest.phone)} />
      </TemplateFrame>
    );
  }

  // Regista a abertura do convite (para o organizador ver quem já abriu), no máximo uma vez por 30 minutos.
  const cutoff = new Date(Date.now() - 30 * 60_000);
  const counted = await db.guest.updateMany({
    where: { id: guest.id, OR: [{ lastViewedAt: null }, { lastViewedAt: { lt: cutoff } }] },
    data: { openCount: { increment: 1 }, firstOpenedAt: guest.firstOpenedAt ?? new Date(), lastViewedAt: new Date() },
  });
  if (counted.count > 0) await logAccess(guest.id, "VIEW");

  const epcPayload = event.contributionIban ? buildEpcPayload({ iban: event.contributionIban, name: event.hostNames, remittance: `Presente ${event.title}`.slice(0, 140) }) : null;
  const [gifts, guestbook, qrDataUrl, epcQr, livePhotos, myRequests] = await Promise.all([
    event.giftsEnabled
      ? db.giftItem.findMany({ where: { eventId: event.id }, include: { reservations: true }, orderBy: [{ kind: "desc" }, { createdAt: "asc" }] })
      : Promise.resolve([]),
    event.guestbookEnabled
      ? db.guestbookEntry.findMany({ where: { eventId: event.id }, include: { guest: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 30 })
      : Promise.resolve([]),
    QRCode.toDataURL(guest.checkinCode, { margin: 1, width: 240 }),
    epcPayload ? QRCode.toDataURL(epcPayload, { margin: 1, width: 220, errorCorrectionLevel: "M" }) : Promise.resolve(null),
    event.liveGalleryEnabled
      ? db.eventPhoto.findMany({ where: { eventId: event.id, kind: "LIVE", hiddenAt: null }, include: { guest: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 60 })
      : Promise.resolve([]),
    event.requestsEnabled ? db.guestRequest.findMany({ where: { guestId: guest.id }, orderBy: { createdAt: "desc" }, take: 20 }) : Promise.resolve([]),
  ]);

  const giftViews: GiftView[] = gifts.map((g) => {
    const mine = g.reservations.find((r) => r.guestId === guest.id);
    return {
      id: g.id,
      kind: g.kind,
      name: g.name,
      description: g.description,
      price: g.price,
      imageUrl: g.imageUrl,
      storeUrl: g.storeUrl,
      quantity: g.quantity,
      reservedByOthers: g.reservations.filter((r) => r.guestId !== guest.id).reduce((s, r) => s + r.quantity, 0),
      mine: mine ? { quantity: mine.quantity, amount: mine.amount, note: mine.note } : null,
    };
  });

  const deadlinePassed = !!event.rsvpDeadline && calendarDaysUntil(event.rsvpDeadline, event.timezone) < 0;
  const storyTitle = event.type === "BIRTHDAY" ? "A nossa história" : event.type === "WEDDING" || event.type === "ENGAGEMENT" ? "A nossa história" : "História";
  const partyTitle = event.type === "WEDDING" ? "Padrinhos e madrinhas" : "Pessoas especiais";
  const googleUrl = googleCalendarUrl({ title: event.title, start: event.date, end: eventEnd(event.date, event.endTime, event.timezone), location: [event.venueName, event.venueAddress].filter(Boolean).join(", "), details: event.message ?? undefined });
  const daysLeft = calendarDaysUntil(event.date, event.timezone);

  const body = (
    <Invite event={event} guestName={guest.name}>
      <DetailsSection event={event} calendarUrl={`/c/${token}/calendar.ics`} googleUrl={googleUrl} daysLeft={daysLeft} />
      <StorySection items={parseStory(event.storyJson)} title={storyTitle} />
      <ProgramSection items={parseProgram(event.programJson)} />
      <GallerySection images={parseGallery(event.galleryJson)} />
      <PartySection members={parseParty(event.partyJson)} title={partyTitle} />
      <MenuSection menu={parseMenu(event.menuJson)} />
      <RsvpForm
        token={token}
        maxCompanions={guest.maxCompanions}
        allowChildren={event.allowChildren}
        current={{ rsvpStatus: guest.rsvpStatus, companions: guest.companions, companionNames: guest.companionNames, dietaryNotes: guest.dietaryNotes, rsvpMessage: guest.rsvpMessage, songRequest: guest.songRequest }}
        deadlinePassed={deadlinePassed}
        deadlineLabel={event.rsvpDeadline ? formatEventDate(event.rsvpDeadline, false, event.timezone) : undefined}
        songRequests={event.songRequestsEnabled}
      />
      {event.giftsEnabled && (giftViews.length > 0 || event.contributionIban || event.contributionMbway) && (
        <GiftList
          token={token}
          gifts={giftViews}
          currency={event.currency}
          contribution={{ iban: event.contributionIban, mbway: event.contributionMbway, note: event.contributionNote, qrDataUrl: epcQr }}
        />
      )}
      {event.guestbookEnabled && (
        <GuestbookSection tz={event.timezone} entries={guestbook.map((e) => ({ id: e.id, name: e.guest.name, message: e.message, createdAt: e.createdAt }))}>
          <GuestbookForm token={token} />
        </GuestbookSection>
      )}
      <InfoSection hashtag={event.hashtag} extraInfo={event.extraInfo} />
      {event.requestsEnabled && (
        <RequestsPanel token={token} guestName={guest.name} requests={myRequests.map((r) => ({ id: r.id, kind: r.kind, text: r.text, status: r.status, createdAt: r.createdAt }))} eventDate={event.date} />
      )}
      {event.liveGalleryEnabled && (
        <LiveGallery
          token={token}
          eventDate={event.date}
          photos={livePhotos.map((p) => ({ id: p.id, url: `/media/${p.mediaId}`, caption: p.caption, by: p.guest?.name ?? null, mine: p.guestId === guest.id, createdAt: p.createdAt }))}
        />
      )}
      <CheckinSection qrDataUrl={qrDataUrl} code={guest.checkinCode} checkedInAt={guest.checkedInAt} tz={event.timezone} />
      <p className="pb-6 text-center text-xs opacity-50">
        Convite pessoal de {guest.name} · intransmissível · criado com Liplip
      </p>
    </Invite>
  );

  // O leitor de música fica fora do envelope para não ser desmontado quando o convite se revela.
  const music = event.musicUrl ? <MusicPlayer src={event.musicUrl} autoplay={event.envelopeEnabled} /> : null;
  // Sem envelope, o botão de música precisa na mesma das variáveis de cor do template.
  if (!event.envelopeEnabled) {
    return (
      <TemplateFrame templateId={event.templateId} accentColor={event.accentColor}>
        {music}
        {body}
      </TemplateFrame>
    );
  }
  return (
    <TemplateFrame templateId={event.templateId} accentColor={event.accentColor}>
      {music}
      <Envelope hostNames={event.hostNames} guestName={guest.name} kicker={eventKicker(event)}>
        {body}
      </Envelope>
    </TemplateFrame>
  );
}
