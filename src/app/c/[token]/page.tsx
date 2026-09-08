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

  if (!(await isGuestAuthorized(guest, event))) {
    return (
      <TemplateFrame templateId={event.templateId} accentColor={event.accentColor}>
        <OtpGate token={token} guestName={guest.name} hostNames={event.hostNames} maskedPhone={maskPhone(guest.phone)} />
      </TemplateFrame>
    );
  }

  // Regista a abertura do convite (para o organizador ver quem já abriu), no máximo uma vez por 30 minutos.
  const lastView = await db.accessLog.findFirst({ where: { guestId: guest.id, outcome: "VIEW" }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
  if (!lastView || Date.now() - lastView.createdAt.getTime() > 30 * 60_000) {
    await db.guest.update({
      where: { id: guest.id },
      data: { openCount: { increment: 1 }, firstOpenedAt: guest.firstOpenedAt ?? new Date() },
    });
    await logAccess(guest.id, "VIEW");
  }

  const epcPayload = event.contributionIban ? buildEpcPayload({ iban: event.contributionIban, name: event.hostNames, remittance: `Presente ${event.title}`.slice(0, 140) }) : null;
  const [gifts, guestbook, qrDataUrl, epcQr] = await Promise.all([
    event.giftsEnabled
      ? db.giftItem.findMany({ where: { eventId: event.id }, include: { reservations: true }, orderBy: [{ kind: "desc" }, { createdAt: "asc" }] })
      : Promise.resolve([]),
    event.guestbookEnabled
      ? db.guestbookEntry.findMany({ where: { eventId: event.id }, include: { guest: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 30 })
      : Promise.resolve([]),
    QRCode.toDataURL(guest.checkinCode, { margin: 1, width: 240 }),
    epcPayload ? QRCode.toDataURL(epcPayload, { margin: 1, width: 220, errorCorrectionLevel: "M" }) : Promise.resolve(null),
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

  const deadlinePassed = !!event.rsvpDeadline && event.rsvpDeadline < new Date();
  const storyTitle = event.type === "BIRTHDAY" ? "A nossa história" : event.type === "WEDDING" || event.type === "ENGAGEMENT" ? "A nossa história" : "História";
  const partyTitle = event.type === "WEDDING" ? "Padrinhos e madrinhas" : "Pessoas especiais";
  const googleUrl = googleCalendarUrl({ title: event.title, start: event.date, location: [event.venueName, event.venueAddress].filter(Boolean).join(", "), details: event.message ?? undefined });

  const body = (
    <Invite event={event} guestName={guest.name}>
      {event.musicUrl && <MusicPlayer src={event.musicUrl} autoplay={event.envelopeEnabled} />}
      <DetailsSection event={event} calendarUrl={`/c/${token}/calendar.ics`} googleUrl={googleUrl} />
      <StorySection items={parseStory(event.storyJson)} title={storyTitle} />
      <ProgramSection items={parseProgram(event.programJson)} />
      <GallerySection images={parseGallery(event.galleryJson)} />
      <PartySection members={parseParty(event.partyJson)} title={partyTitle} />
      <RsvpForm
        token={token}
        maxCompanions={guest.maxCompanions}
        allowChildren={event.allowChildren}
        current={guest}
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
        <GuestbookSection entries={guestbook.map((e) => ({ id: e.id, name: e.guest.name, message: e.message, createdAt: e.createdAt }))}>
          <GuestbookForm token={token} />
        </GuestbookSection>
      )}
      <InfoSection hashtag={event.hashtag} extraInfo={event.extraInfo} />
      <CheckinSection qrDataUrl={qrDataUrl} code={guest.checkinCode} checkedInAt={guest.checkedInAt} />
      <p className="pb-6 text-center text-xs opacity-50">
        Convite pessoal de {guest.name} · intransmissível · criado com Lipliip
      </p>
    </Invite>
  );

  if (!event.envelopeEnabled) return body;
  return (
    <TemplateFrame templateId={event.templateId} accentColor={event.accentColor}>
      <Envelope hostNames={event.hostNames} guestName={guest.name} kicker={eventKicker(event)}>
        {body}
      </Envelope>
    </TemplateFrame>
  );
}
