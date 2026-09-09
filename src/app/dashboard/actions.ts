"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOwnedEvent, requireUser } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { generateCheckinCode, generateInviteToken } from "@/lib/tokens";
import { parseGuestImport } from "@/lib/csv";
import { SUPPORTED_COUNTRIES } from "@/lib/phone";
import { parseGalleryText, parsePartyText, parseProgramText, parseStoryText } from "@/lib/event-types";
import { getSmsProvider, isSmsConfigured } from "@/lib/sms";
import { rateLimit, rateLimitRefund } from "@/lib/rate-limit";
import { flash, str, opt, bool, parseMoney } from "@/lib/form";
import { inviteShareMessage, inviteUrl } from "@/lib/urls";
import { performCheckin } from "@/lib/checkin";
import { TEMPLATES } from "@/lib/templates";
import { httpUrlOrNull } from "@/lib/validation";
import { accessibleEventWhere, editableEventWhere, requireEventAccess } from "@/lib/access";
import { buildChecklist } from "@/lib/checklists";
import { COUNTRY_TIMEZONE, isValidTimezone, localInputToDate } from "@/lib/timezone";
import { planForEvent } from "@/lib/platform";
import { getTemplateState } from "@/lib/templates-settings";

function dateOrNull(v: string, tz: string) {
  if (!v) return null;
  return localInputToDate(v, tz);
}

// ---------- Eventos ----------

const eventSchema = z.object({
  type: z.enum(["WEDDING", "ENGAGEMENT", "BIRTHDAY", "OTHER"]),
  templateId: z.string().refine((id) => TEMPLATES.some((t) => t.id === id), "Template inválido"),
  title: z.string().trim().max(120).optional().default(""),
  hostNames: z.string().trim().min(1, "Indique os nomes dos anfitriões").max(120),
  date: z.string().min(1, "Indique a data"),
  venueName: z.string().trim().min(2, "Indique o local").max(120),
  country: z.enum(SUPPORTED_COUNTRIES.map((c) => c.code) as [string, ...string[]], { message: "País inválido" }),
});
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function eventDataFromForm(fd: FormData) {
  const parsed = eventSchema.safeParse({
    type: fd.get("type"),
    templateId: fd.get("templateId"),
    title: fd.get("title") ?? "",
    hostNames: fd.get("hostNames"),
    date: fd.get("date"),
    venueName: fd.get("venueName"),
    country: fd.get("country") || "PT",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message } as const;
  const tzInput = str(fd, "timezone", 60);
  const timezone = isValidTimezone(tzInput) ? tzInput : (COUNTRY_TIMEZONE[parsed.data.country] ?? "Europe/Lisbon");
  const date = dateOrNull(parsed.data.date, timezone);
  if (!date) return { error: "Data inválida" } as const;
  const typeLabel = { WEDDING: "Casamento de", ENGAGEMENT: "Noivado de", BIRTHDAY: "Aniversário de", OTHER: "Festa de" }[parsed.data.type];
  return {
    data: {
      ...parsed.data,
      title: parsed.data.title || `${typeLabel} ${parsed.data.hostNames}`.slice(0, 120),
      timezone,
      date,
      endTime: opt(fd, "endTime", 10),
      message: opt(fd, "message", 1000),
      venueAddress: opt(fd, "venueAddress", 200),
      mapsUrl: httpUrlOrNull(str(fd, "mapsUrl", 500)),
      dressCode: opt(fd, "dressCode", 80),
      coverImageUrl: httpUrlOrNull(str(fd, "coverImageUrl", 500)),
      accentColor: HEX_COLOR.test(str(fd, "accentColor", 9)) ? str(fd, "accentColor", 9) : null,
      currency: str(fd, "currency", 3).toUpperCase() || "EUR",
      rsvpDeadline: dateOrNull(str(fd, "rsvpDeadline", 30) ? `${str(fd, "rsvpDeadline", 30)}T23:59` : "", timezone),
      allowChildren: fd.has("_full") ? bool(fd, "allowChildren") : true,
      verificationRequired: !fd.has("_full") ? true : bool(fd, "verificationRequired"),
      maxDevicesPerGuest: Math.min(10, Math.max(1, Number.parseInt(str(fd, "maxDevicesPerGuest", 3), 10) || 2)),
      guestbookEnabled: !fd.has("_full") ? true : bool(fd, "guestbookEnabled"),
      giftsEnabled: !fd.has("_full") ? true : bool(fd, "giftsEnabled"),
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
  if (result.error !== undefined) flash(`/dashboard/events/new?type=${encodeURIComponent(str(fd, "type", 20))}&template=${encodeURIComponent(str(fd, "templateId", 40))}`, "error", result.error);
  // Evento e checklist inicial (prazos calculados a partir da data) numa única escrita.
  const event = await db.event.create({
    data: { ...result.data, ownerId: user.id, tasks: { createMany: { data: buildChecklist(result.data.type, result.data.date) } } },
  });
  redirect(`/dashboard/events/${event.id}?ok=${encodeURIComponent("Evento criado! Já tem uma checklist de tarefas com prazos. Depois, adicione os convidados.")}`);
}

export async function updateEventAction(eventId: string, fd: FormData) {
  const { event } = await requireOwnedEvent(eventId);
  const path = `/dashboard/events/${eventId}/settings`;
  const result = eventDataFromForm(fd);
  if (result.error !== undefined) flash(path, "error", result.error);
  // O design (template, cor, capa) só é alterado no separador Design.
  const data = { ...result.data };
  delete (data as Partial<typeof data>).templateId;
  delete (data as Partial<typeof data>).accentColor;
  delete (data as Partial<typeof data>).coverImageUrl;
  const deltaMs = data.date.getTime() - event.date.getTime();
  await db.$transaction(async (tx) => {
    await tx.event.update({ where: { id: eventId }, data });
    // Se a data mudou, as tarefas por fazer acompanham (mantêm a mesma antecedência).
    if (deltaMs !== 0) {
      await tx.$executeRaw`UPDATE "Task" SET "dueAt" = "dueAt" + (${deltaMs}::bigint * interval '1 millisecond') WHERE "eventId" = ${eventId} AND "completedAt" IS NULL AND "dueAt" IS NOT NULL`;
    }
  });
  revalidatePath(`/dashboard/events/${eventId}`);
  flash(path, "ok", deltaMs !== 0 ? "Alterações guardadas. Os prazos das tarefas por fazer foram ajustados à nova data." : "Alterações guardadas.");
}

export async function updateDesignAction(eventId: string, fd: FormData) {
  const { event } = await requireOwnedEvent(eventId);
  const path = `/dashboard/events/${eventId}/design`;
  const templateId = str(fd, "templateId", 40);
  if (!TEMPLATES.some((t) => t.id === templateId)) flash(path, "error", "Template inválido");
  // Mudar para um template desativado ou Premium (sem o evento ativado) não é permitido; manter o atual é.
  if (templateId !== event.templateId) {
    const [state, plan] = await Promise.all([getTemplateState(templateId), planForEvent(event)]);
    if (!state || !state.enabled) flash(path, "error", "Este template já não está disponível. Escolha outro.");
    if (state.premium && !plan.active) flash(path, "error", `O template "${state.name}" é Premium e só pode ser usado depois de ativar o evento. Ative-o em Definições > Ativação.`);
  }
  const accent = str(fd, "accentColor", 9);
  await db.event.update({
    where: { id: eventId },
    data: { templateId, accentColor: bool(fd, "useCustomColor") && HEX_COLOR.test(accent) ? accent : null, coverImageUrl: httpUrlOrNull(str(fd, "coverImageUrl", 500)) },
  });
  revalidatePath(`/dashboard/events/${eventId}`);
  flash(`/dashboard/events/${eventId}/design`, "ok", "Design atualizado.");
}

export async function updateContentAction(eventId: string, fd: FormData) {
  await requireOwnedEvent(eventId);
  const path = `/dashboard/events/${eventId}/content`;
  const musicRaw = str(fd, "musicUrl", 500);
  const musicUrl = httpUrlOrNull(musicRaw);
  const musicInvalid = !!musicRaw && !musicUrl;
  const musicWarning = musicInvalid ? " O link da música foi ignorado (mantém-se o anterior): tem de começar por http:// ou https://." : "";
  await db.event.update({
    where: { id: eventId },
    data: {
      // Link inválido: mantém o valor guardado em vez de o apagar.
      musicUrl: musicInvalid ? undefined : musicUrl,
      hashtag: opt(fd, "hashtag", 60),
      extraInfo: opt(fd, "extraInfo", 3000),
      galleryJson: JSON.stringify(parseGalleryText(str(fd, "galleryText", 10_000)).slice(0, 30)),
      storyJson: JSON.stringify(parseStoryText(str(fd, "storyText", 10_000)).slice(0, 20)),
      partyJson: JSON.stringify(parsePartyText(str(fd, "partyText", 10_000)).slice(0, 30)),
      envelopeEnabled: bool(fd, "envelopeEnabled"),
      songRequestsEnabled: bool(fd, "songRequestsEnabled"),
    },
  });
  revalidatePath(`/dashboard/events/${eventId}`);
  flash(path, musicWarning ? "error" : "ok", `Conteúdo guardado.${musicWarning}`);
}

export async function assignTableAction(eventId: string, fd: FormData) {
  await requireOwnedEvent(eventId);
  const guestId = str(fd, "guestId", 40);
  const tableNumber = opt(fd, "tableNumber", 20);
  await db.guest.updateMany({ where: { id: guestId, eventId }, data: { tableNumber } });
  revalidatePath(`/dashboard/events/${eventId}/tables`);
}

export async function deleteEventAction(eventId: string) {
  await requireEventAccess(eventId, { ownerOnly: true });
  await db.event.delete({ where: { id: eventId } });
  flash("/dashboard", "ok", "Evento eliminado.");
}

// ---------- Convidados ----------

const MAX_COMPANIONS = 20;

class DuplicatePhoneError extends Error {}

async function createGuest(eventId: string, input: { name: string; phone: string; maxCompanions: number; groupName?: string | null; email?: string | null; tableNumber?: string | null }) {
  // Repete se, por azar, o código de check-in ou o token colidirem com outro já existente.
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.guest.create({
        data: {
          eventId,
          name: input.name,
          phone: input.phone,
          email: input.email ?? null,
          groupName: input.groupName ?? null,
          tableNumber: input.tableNumber ?? null,
          maxCompanions: Math.min(MAX_COMPANIONS, Math.max(0, input.maxCompanions)),
          token: generateInviteToken(),
          checkinCode: generateCheckinCode(),
        },
      });
    } catch (e) {
      const err = e as { code?: string; meta?: { target?: string[] } };
      if (err.code === "P2002" && err.meta?.target?.includes("phone")) throw new DuplicatePhoneError();
      if (err.code !== "P2002" || attempt >= 4) throw e;
    }
  }
}

/** Limite do plano gratuito: conta só os convites não suspensos. `remaining` é Infinity quando o evento está ativado. */
async function guestLimitFor(event: { activatedAt: Date | null }, eventId: string) {
  const plan = await planForEvent(event);
  if (!Number.isFinite(plan.guestLimit)) return { limit: plan.guestLimit, used: 0, remaining: Number.POSITIVE_INFINITY };
  const used = await db.guest.count({ where: { eventId, suspendedAt: null } });
  return { limit: plan.guestLimit, used, remaining: Math.max(0, plan.guestLimit - used) };
}

function freeLimitMessage(limit: number) {
  return `Plano gratuito: até ${limit} convidados. Ative o evento para adicionar mais (separador Definições > Ativação).`;
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
  const limit = await guestLimitFor(event, eventId);
  if (limit.remaining <= 0) flash(path, "error", freeLimitMessage(limit.limit));
  try {
    await createGuest(eventId, {
      name,
      phone,
      maxCompanions: Math.max(0, Number.parseInt(str(fd, "maxCompanions", 3), 10) || 0),
      groupName: opt(fd, "groupName", 60),
      email: opt(fd, "email", 120),
      tableNumber: opt(fd, "tableNumber", 20),
    });
  } catch (e) {
    if (e instanceof DuplicatePhoneError) flash(path, "error", "Já existe um convidado com este telefone.");
    throw e;
  }
  flash(path, "ok", `${name} adicionado(a).`);
}

export async function importGuestsAction(eventId: string, fd: FormData) {
  const { event } = await requireOwnedEvent(eventId);
  const path = `/dashboard/events/${eventId}/guests`;
  const { rows, errors } = parseGuestImport(str(fd, "text", 200_000));
  const [existingRows, limit] = await Promise.all([db.guest.findMany({ where: { eventId }, select: { phone: true } }), guestLimitFor(event, eventId)]);
  const existing = new Set(existingRows.map((g) => g.phone));
  let created = 0;
  let overLimit = 0;
  const problems = errors.map((e) => `linha ${e.line}: ${e.message}`);
  for (const row of rows) {
    if (created >= limit.remaining) {
      overLimit++;
      continue;
    }
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
    try {
      await createGuest(eventId, { name: row.name, phone, maxCompanions: row.maxCompanions, groupName: row.groupName, email: row.email });
      created++;
    } catch (e) {
      if (e instanceof DuplicatePhoneError) problems.push(`linha ${row.line}: telefone repetido (${row.name})`);
      else throw e;
    }
  }
  const summary =
    `${created} convidado(s) importado(s).` +
    (problems.length ? ` Ignorados: ${problems.slice(0, 8).join("; ")}${problems.length > 8 ? "…" : ""}` : "") +
    (overLimit ? ` ${overLimit} linha(s) não importada(s): ${freeLimitMessage(limit.limit)}` : "");
  flash(path, (problems.length || overLimit) && !created ? "error" : "ok", summary);
}

async function requireOwnedGuest(guestId: string) {
  const user = await requireUser();
  const guest = await db.guest.findFirst({ where: { id: guestId, event: editableEventWhere(user.id) }, include: { event: true } });
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
  const duplicate = await db.guest.findFirst({ where: { eventId: guest.eventId, phone, id: { not: guestId } } });
  if (duplicate) flash(path, "error", `Já existe outro convidado com este telefone: ${duplicate.name}.`);
  const maxCompanions = Math.min(MAX_COMPANIONS, Math.max(0, Number.parseInt(str(fd, "maxCompanions", 3), 10) || 0));
  const data = {
    name,
    phone,
    email: opt(fd, "email", 120),
    groupName: opt(fd, "groupName", 60),
    tableNumber: opt(fd, "tableNumber", 20),
    maxCompanions,
    companions: Math.min(guest.companions, maxCompanions),
  };
  // Se o telefone mudou, as verificações anteriores deixam de fazer sentido.
  if (phone !== guest.phone) {
    await db.$transaction([
      db.guestDevice.deleteMany({ where: { guestId } }),
      db.otpCode.deleteMany({ where: { guestId } }),
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
    db.otpCode.updateMany({ where: { guestId, consumedAt: null }, data: { consumedAt: new Date() } }),
    db.guest.update({ where: { id: guestId }, data: { token: generateInviteToken(), checkinCode: generateCheckinCode(), sentAt: null, sentVia: null, verifiedAt: null } }),
  ]);
  flash(`/dashboard/events/${guest.eventId}/guests/${guestId}`, "ok", "Novo link gerado. O link anterior foi revogado.");
}

/** Suspende (ou reativa) um convite: sem acesso, sem dispositivos e com as reservas de presentes libertadas. */
export async function toggleSuspendAction(guestId: string, returnTo: string | null, _fd?: FormData) {
  const guest = await requireOwnedGuest(guestId);
  if (guest.suspendedAt) {
    await db.guest.update({ where: { id: guestId }, data: { suspendedAt: null } });
  } else {
    await db.$transaction([
      db.guestDevice.deleteMany({ where: { guestId } }),
      db.otpCode.updateMany({ where: { guestId, consumedAt: null }, data: { consumedAt: new Date() } }),
      db.giftReservation.deleteMany({ where: { guestId } }),
      db.guest.update({ where: { id: guestId }, data: { suspendedAt: new Date() } }),
    ]);
  }
  revalidatePath(`/dashboard/events/${guest.eventId}/guests`);
  flash(returnTo ?? `/dashboard/events/${guest.eventId}/guests/${guestId}`, "ok", guest.suspendedAt ? `Convite de ${guest.name} reativado.` : `Convite de ${guest.name} suspenso.`);
}

/** Remove os dispositivos autorizados: o convidado terá de validar o telemóvel de novo. */
export async function resetDevicesAction(guestId: string) {
  const guest = await requireOwnedGuest(guestId);
  await db.$transaction([
    db.guestDevice.deleteMany({ where: { guestId } }),
    db.otpCode.updateMany({ where: { guestId, consumedAt: null }, data: { consumedAt: new Date() } }),
  ]);
  flash(`/dashboard/events/${guest.eventId}/guests/${guestId}`, "ok", "Dispositivos removidos.");
}

export async function markSentAction(guestId: string, via: string, returnTo?: string) {
  const guest = await requireOwnedGuest(guestId);
  await db.guest.update({ where: { id: guestId }, data: { sentAt: new Date(), sentVia: via.slice(0, 20) } });
  revalidatePath(`/dashboard/events/${guest.eventId}/guests`);
  if (returnTo) flash(returnTo, "ok", `${guest.name}: marcado como enviado.`);
}

export async function sendSmsInviteAction(guestId: string, returnTo?: string | null, _fd?: FormData) {
  const guest = await requireOwnedGuest(guestId);
  const path = returnTo ?? `/dashboard/events/${guest.eventId}/guests`;
  if (!isSmsConfigured()) flash(path, "error", "O envio de SMS não está configurado. Use o WhatsApp ou copie o link.");
  const user = await requireUser();
  if (!rateLimit(`sms-guest:${guestId}`, 1, 10 * 60_000).ok) flash(path, "error", `Já foi enviado um SMS a ${guest.name} há menos de 10 minutos.`);
  if (!rateLimit(`sms-user:${user.id}`, 200, 24 * 60 * 60_000).ok) flash(path, "error", "Limite diário de SMS atingido para a sua conta. Use o WhatsApp para os restantes convidados.");
  const body = inviteShareMessage({ guestName: guest.name, hostNames: guest.event.hostNames, eventTitle: guest.event.title, url: inviteUrl(guest.token) });
  let res: { ok: boolean; error?: string };
  try {
    res = await getSmsProvider().send(guest.phone, body);
  } catch (e) {
    res = { ok: false, error: (e as Error).message };
  }
  if (!res.ok) {
    console.error("Falha ao enviar SMS de convite:", res.error);
    // O envio não aconteceu: liberta os limites para permitir nova tentativa.
    rateLimitRefund(`sms-guest:${guestId}`);
    rateLimitRefund(`sms-user:${user.id}`);
    flash(path, "error", "Não foi possível enviar o SMS. Verifique a configuração do fornecedor de SMS.");
  }
  await db.guest.update({ where: { id: guestId }, data: { sentAt: new Date(), sentVia: "sms" } });
  flash(path, "ok", `SMS enviado a ${guest.name}.`);
}

export async function checkinAction(eventId: string, fd: FormData) {
  const { event } = await requireEventAccess(eventId, { allowStaff: true });
  const path = `/dashboard/events/${eventId}/checkin`;
  // Lógica partilhada com a página de receção sem conta (ver lib/checkin.ts).
  const result = await performCheckin(eventId, str(fd, "code", 20), event.timezone);
  flash(path, result.ok ? "ok" : "error", result.message);
}

export async function toggleCheckinAction(guestId: string) {
  const user = await requireUser();
  const guest = await db.guest.findFirst({ where: { id: guestId, event: accessibleEventWhere(user.id) } });
  if (!guest) redirect("/dashboard");
  // Um convite suspenso não entra pelo botão manual (o mesmo guarda que o código/QR).
  if (!guest.checkedInAt && guest.suspendedAt) flash(`/dashboard/events/${guest.eventId}/checkin`, "error", `O convite de ${guest.name} está suspenso. Confirme com os anfitriões antes de deixar entrar.`);
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
  const price = parseMoney(str(fd, "price", 20));
  if (str(fd, "price", 20) && price == null) flash(path, "error", "Preço inválido. Use por exemplo 89,90 ou 1250.");
  await db.giftItem.create({
    data: {
      eventId,
      kind,
      name,
      description: opt(fd, "description", 300),
      price: price && price > 0 ? price : null,
      imageUrl: httpUrlOrNull(str(fd, "imageUrl", 500)),
      storeUrl: httpUrlOrNull(str(fd, "storeUrl", 500)),
      quantity: kind === "CASH" ? 1 : Math.max(1, Number.parseInt(str(fd, "quantity", 4), 10) || 1),
    },
  });
  flash(path, "ok", "Presente adicionado.");
}

export async function deleteGiftAction(giftId: string) {
  const user = await requireUser();
  const gift = await db.giftItem.findFirst({ where: { id: giftId, event: editableEventWhere(user.id) } });
  if (!gift) redirect("/dashboard");
  await db.giftItem.delete({ where: { id: giftId } });
  flash(`/dashboard/events/${gift.eventId}/gifts`, "ok", "Presente removido.");
}

// ---------- Livro de mensagens ----------

export async function deleteGuestbookEntryAction(entryId: string) {
  const user = await requireUser();
  const entry = await db.guestbookEntry.findFirst({ where: { id: entryId, event: editableEventWhere(user.id) } });
  if (!entry) redirect("/dashboard");
  await db.guestbookEntry.delete({ where: { id: entryId } });
  flash(`/dashboard/events/${entry.eventId}/guestbook`, "ok", "Mensagem removida.");
}
