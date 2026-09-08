"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOwnedEvent, requireUser } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { generateCheckinCode, generateInviteToken } from "@/lib/tokens";
import { parseGuestImport } from "@/lib/csv";
import { parseProgramText } from "@/lib/event-types";
import { getSmsProvider } from "@/lib/sms";
import { inviteShareMessage, inviteUrl } from "@/lib/urls";
import { TEMPLATES } from "@/lib/templates";

function flash(path: string, kind: "ok" | "error", message: string): never {
  redirect(`${path}?${kind}=${encodeURIComponent(message)}`);
}

function str(fd: FormData, key: string, max = 500) {
  return String(fd.get(key) ?? "").trim().slice(0, max);
}
function opt(fd: FormData, key: string, max = 500) {
  return str(fd, key, max) || null;
}
function bool(fd: FormData, key: string) {
  return fd.get(key) === "on" || fd.get(key) === "true";
}
function dateOrNull(v: string) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ---------- Eventos ----------

const eventSchema = z.object({
  type: z.enum(["WEDDING", "ENGAGEMENT", "BIRTHDAY", "OTHER"]),
  templateId: z.string().refine((id) => TEMPLATES.some((t) => t.id === id), "Template inválido"),
  title: z.string().trim().min(3, "Indique o título do evento").max(120),
  hostNames: z.string().trim().min(1, "Indique os nomes dos anfitriões").max(120),
  date: z.string().min(1, "Indique a data"),
  venueName: z.string().trim().min(2, "Indique o local").max(120),
  country: z.string().length(2),
});

function eventDataFromForm(fd: FormData) {
  const parsed = eventSchema.safeParse({
    type: fd.get("type"),
    templateId: fd.get("templateId"),
    title: fd.get("title"),
    hostNames: fd.get("hostNames"),
    date: fd.get("date"),
    venueName: fd.get("venueName"),
    country: fd.get("country") || "PT",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message } as const;
  const date = dateOrNull(parsed.data.date);
  if (!date) return { error: "Data inválida" } as const;
  return {
    data: {
      ...parsed.data,
      date,
      endTime: opt(fd, "endTime", 10),
      message: opt(fd, "message", 1000),
      venueAddress: opt(fd, "venueAddress", 200),
      mapsUrl: opt(fd, "mapsUrl", 500),
      dressCode: opt(fd, "dressCode", 80),
      coverImageUrl: opt(fd, "coverImageUrl", 500),
      accentColor: opt(fd, "accentColor", 9),
      currency: str(fd, "currency", 3).toUpperCase() || "EUR",
      rsvpDeadline: dateOrNull(str(fd, "rsvpDeadline", 30)),
      allowChildren: bool(fd, "allowChildren"),
      verificationRequired: bool(fd, "verificationRequired"),
      maxDevicesPerGuest: Math.min(10, Math.max(1, Number.parseInt(str(fd, "maxDevicesPerGuest", 3), 10) || 2)),
      guestbookEnabled: bool(fd, "guestbookEnabled"),
      giftsEnabled: bool(fd, "giftsEnabled"),
      programJson: JSON.stringify(parseProgramText(str(fd, "programText", 3000))),
      contributionIban: opt(fd, "contributionIban", 40),
      contributionMbway: opt(fd, "contributionMbway", 30),
      contributionNote: opt(fd, "contributionNote", 300),
    },
  } as const;
}

export async function createEventAction(fd: FormData) {
  const user = await requireUser();
  const result = eventDataFromForm(fd);
  if (result.error !== undefined) flash("/dashboard/events/new", "error", result.error);
  const event = await db.event.create({ data: { ...result.data, ownerId: user.id } });
  redirect(`/dashboard/events/${event.id}?ok=${encodeURIComponent("Evento criado! Agora adicione os convidados.")}`);
}

export async function updateEventAction(eventId: string, fd: FormData) {
  await requireOwnedEvent(eventId);
  const path = `/dashboard/events/${eventId}/settings`;
  const result = eventDataFromForm(fd);
  if (result.error !== undefined) flash(path, "error", result.error);
  await db.event.update({ where: { id: eventId }, data: result.data });
  revalidatePath(`/dashboard/events/${eventId}`);
  flash(path, "ok", "Alterações guardadas.");
}

export async function updateDesignAction(eventId: string, fd: FormData) {
  await requireOwnedEvent(eventId);
  const templateId = str(fd, "templateId", 40);
  if (!TEMPLATES.some((t) => t.id === templateId)) flash(`/dashboard/events/${eventId}/design`, "error", "Template inválido");
  const accent = opt(fd, "accentColor", 9);
  await db.event.update({
    where: { id: eventId },
    data: { templateId, accentColor: bool(fd, "useCustomColor") ? accent : null, coverImageUrl: opt(fd, "coverImageUrl", 500) },
  });
  revalidatePath(`/dashboard/events/${eventId}`);
  flash(`/dashboard/events/${eventId}/design`, "ok", "Design atualizado.");
}

export async function deleteEventAction(eventId: string) {
  await requireOwnedEvent(eventId);
  await db.event.delete({ where: { id: eventId } });
  flash("/dashboard", "ok", "Evento eliminado.");
}

// ---------- Convidados ----------

async function createGuest(eventId: string, input: { name: string; phone: string; maxCompanions: number; groupName?: string | null; email?: string | null; tableNumber?: string | null }) {
  return db.guest.create({
    data: {
      eventId,
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      groupName: input.groupName ?? null,
      tableNumber: input.tableNumber ?? null,
      maxCompanions: input.maxCompanions,
      token: generateInviteToken(),
      checkinCode: generateCheckinCode(),
    },
  });
}

export async function addGuestAction(eventId: string, fd: FormData) {
  const { event } = await requireOwnedEvent(eventId);
  const path = `/dashboard/events/${eventId}/guests`;
  const name = str(fd, "name", 120);
  if (name.length < 2) flash(path, "error", "Indique o nome do convidado.");
  const phone = normalizePhone(str(fd, "phone", 30), event.country);
  if (!phone) flash(path, "error", "Telefone inválido. Use o formato internacional (+351 ...) ou o número nacional.");
  const duplicate = await db.guest.findFirst({ where: { eventId, phone } });
  if (duplicate) flash(path, "error", `Já existe um convidado com este telefone: ${duplicate.name}.`);
  await createGuest(eventId, {
    name,
    phone,
    maxCompanions: Math.max(0, Number.parseInt(str(fd, "maxCompanions", 3), 10) || 0),
    groupName: opt(fd, "groupName", 60),
    email: opt(fd, "email", 120),
    tableNumber: opt(fd, "tableNumber", 20),
  });
  flash(path, "ok", `${name} adicionado(a).`);
}

export async function importGuestsAction(eventId: string, fd: FormData) {
  const { event } = await requireOwnedEvent(eventId);
  const path = `/dashboard/events/${eventId}/guests`;
  const { rows, errors } = parseGuestImport(str(fd, "text", 200_000));
  const existing = new Set((await db.guest.findMany({ where: { eventId }, select: { phone: true } })).map((g) => g.phone));
  let created = 0;
  const problems = errors.map((e) => `linha ${e.line}: ${e.message}`);
  for (const row of rows) {
    const phone = normalizePhone(row.phone, event.country);
    if (!phone) {
      problems.push(`linha ${row.line}: telefone inválido (${row.phone})`);
      continue;
    }
    if (existing.has(phone)) {
      problems.push(`linha ${row.line}: telefone repetido (${row.name})`);
      continue;
    }
    existing.add(phone);
    await createGuest(eventId, { name: row.name, phone, maxCompanions: row.maxCompanions, groupName: row.groupName, email: row.email });
    created++;
  }
  const summary = `${created} convidado(s) importado(s).` + (problems.length ? ` Ignorados: ${problems.slice(0, 8).join("; ")}${problems.length > 8 ? "…" : ""}` : "");
  flash(path, problems.length && !created ? "error" : "ok", summary);
}

async function requireOwnedGuest(guestId: string) {
  const user = await requireUser();
  const guest = await db.guest.findFirst({ where: { id: guestId, event: { ownerId: user.id } }, include: { event: true } });
  if (!guest) redirect("/dashboard");
  return guest;
}

export async function updateGuestAction(guestId: string, fd: FormData) {
  const guest = await requireOwnedGuest(guestId);
  const path = `/dashboard/events/${guest.eventId}/guests/${guestId}`;
  const name = str(fd, "name", 120);
  if (name.length < 2) flash(path, "error", "Indique o nome.");
  const phone = normalizePhone(str(fd, "phone", 30), guest.event.country);
  if (!phone) flash(path, "error", "Telefone inválido.");
  const data = {
    name,
    phone,
    email: opt(fd, "email", 120),
    groupName: opt(fd, "groupName", 60),
    tableNumber: opt(fd, "tableNumber", 20),
    maxCompanions: Math.max(0, Number.parseInt(str(fd, "maxCompanions", 3), 10) || 0),
  };
  // Se o telefone mudou, as verificações anteriores deixam de fazer sentido.
  if (phone !== guest.phone) {
    await db.$transaction([
      db.guestDevice.deleteMany({ where: { guestId } }),
      db.guest.update({ where: { id: guestId }, data: { ...data, verifiedAt: null } }),
    ]);
  } else {
    await db.guest.update({ where: { id: guestId }, data });
  }
  flash(path, "ok", "Convidado atualizado.");
}

export async function deleteGuestAction(guestId: string) {
  const guest = await requireOwnedGuest(guestId);
  await db.guest.delete({ where: { id: guestId } });
  flash(`/dashboard/events/${guest.eventId}/guests`, "ok", `${guest.name} removido(a).`);
}

/** Gera um novo link (o antigo deixa de funcionar) e apaga dispositivos verificados. */
export async function regenerateTokenAction(guestId: string) {
  const guest = await requireOwnedGuest(guestId);
  await db.$transaction([
    db.guestDevice.deleteMany({ where: { guestId } }),
    db.guest.update({ where: { id: guestId }, data: { token: generateInviteToken(), checkinCode: generateCheckinCode(), sentAt: null, sentVia: null, verifiedAt: null } }),
  ]);
  flash(`/dashboard/events/${guest.eventId}/guests/${guestId}`, "ok", "Novo link gerado. O link anterior foi revogado.");
}

/** Remove os dispositivos autorizados: o convidado terá de validar o telemóvel de novo. */
export async function resetDevicesAction(guestId: string) {
  const guest = await requireOwnedGuest(guestId);
  await db.guestDevice.deleteMany({ where: { guestId } });
  flash(`/dashboard/events/${guest.eventId}/guests/${guestId}`, "ok", "Dispositivos removidos.");
}

export async function markSentAction(guestId: string, via: string, returnTo?: string) {
  const guest = await requireOwnedGuest(guestId);
  await db.guest.update({ where: { id: guestId }, data: { sentAt: new Date(), sentVia: via.slice(0, 20) } });
  revalidatePath(`/dashboard/events/${guest.eventId}/guests`);
  if (returnTo) redirect(returnTo);
}

export async function sendSmsInviteAction(guestId: string) {
  const guest = await requireOwnedGuest(guestId);
  const path = `/dashboard/events/${guest.eventId}/guests`;
  const body = inviteShareMessage({ guestName: guest.name, hostNames: guest.event.hostNames, eventTitle: guest.event.title, url: inviteUrl(guest.token) });
  const res = await getSmsProvider().send(guest.phone, body);
  if (!res.ok) flash(path, "error", `Falha ao enviar SMS: ${res.error}`);
  await db.guest.update({ where: { id: guestId }, data: { sentAt: new Date(), sentVia: "sms" } });
  flash(path, "ok", `SMS enviado a ${guest.name}.`);
}

export async function checkinAction(eventId: string, fd: FormData) {
  await requireOwnedEvent(eventId);
  const path = `/dashboard/events/${eventId}/checkin`;
  const code = str(fd, "code", 12).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const guest = await db.guest.findFirst({ where: { eventId, checkinCode: code } });
  if (!guest) flash(path, "error", `Código ${code || "(vazio)"} não encontrado.`);
  if (guest.checkedInAt) flash(path, "error", `⚠️ ${guest.name} já fez check-in às ${guest.checkedInAt.toLocaleTimeString("pt-PT")}. Possível entrada duplicada.`);
  await db.guest.update({ where: { id: guest.id }, data: { checkedInAt: new Date() } });
  await db.accessLog.create({ data: { guestId: guest.id, outcome: "CHECKIN" } });
  const extra = guest.rsvpStatus === "ACCEPTED" ? `${guest.companions ? ` +${guest.companions} acompanhante(s)` : ""}${guest.tableNumber ? ` · mesa ${guest.tableNumber}` : ""}` : " (não tinha confirmado presença)";
  flash(path, "ok", `✅ ${guest.name}${extra}`);
}

export async function toggleCheckinAction(guestId: string) {
  const guest = await requireOwnedGuest(guestId);
  await db.guest.update({ where: { id: guestId }, data: { checkedInAt: guest.checkedInAt ? null : new Date() } });
  revalidatePath(`/dashboard/events/${guest.eventId}/checkin`);
}

// ---------- Presentes ----------

export async function addGiftAction(eventId: string, fd: FormData) {
  await requireOwnedEvent(eventId);
  const path = `/dashboard/events/${eventId}/gifts`;
  const name = str(fd, "name", 120);
  if (name.length < 2) flash(path, "error", "Indique o nome do presente.");
  const kind = str(fd, "kind", 10) === "CASH" ? "CASH" : "PRODUCT";
  const price = Number.parseFloat(str(fd, "price", 12).replace(",", "."));
  await db.giftItem.create({
    data: {
      eventId,
      kind,
      name,
      description: opt(fd, "description", 300),
      price: Number.isFinite(price) && price > 0 ? price : null,
      imageUrl: opt(fd, "imageUrl", 500),
      storeUrl: opt(fd, "storeUrl", 500),
      quantity: kind === "CASH" ? 1 : Math.max(1, Number.parseInt(str(fd, "quantity", 4), 10) || 1),
    },
  });
  flash(path, "ok", "Presente adicionado.");
}

export async function deleteGiftAction(giftId: string) {
  const user = await requireUser();
  const gift = await db.giftItem.findFirst({ where: { id: giftId, event: { ownerId: user.id } } });
  if (!gift) redirect("/dashboard");
  await db.giftItem.delete({ where: { id: giftId } });
  flash(`/dashboard/events/${gift.eventId}/gifts`, "ok", "Presente removido.");
}

// ---------- Livro de mensagens ----------

export async function deleteGuestbookEntryAction(entryId: string) {
  const user = await requireUser();
  const entry = await db.guestbookEntry.findFirst({ where: { id: entryId, event: { ownerId: user.id } } });
  if (!entry) redirect("/dashboard");
  await db.guestbookEntry.delete({ where: { id: entryId } });
  flash(`/dashboard/events/${entry.eventId}/guestbook`, "ok", "Mensagem removida.");
}
