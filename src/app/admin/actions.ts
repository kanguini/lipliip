"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { stashSecret } from "@/lib/one-time";
import { sha256 } from "@/lib/tokens";
import { TEMPLATES } from "@/lib/templates";
import { flash, str, opt, bool, parseMoney } from "@/lib/form";

const RESET_TTL_MIN = 30;

/** Ids de utilizador/evento/pedido são cuid: valida a forma antes de os usar na query. */
function cleanId(v: string) {
  return /^[a-z0-9]{10,40}$/i.test(v) ? v : "";
}

/** O caminho de regresso vem ligado à ação pela página; só aceitamos caminhos da própria administração. */
function safeReturn(v: string, fallback: string) {
  return typeof v === "string" && v.startsWith("/admin") && !v.startsWith("//") ? v : fallback;
}

// ---------- Pagamentos ----------

export async function approveOrderAction(orderId: string, returnToRaw: string, _fd?: FormData) {
  const admin = await requireAdmin();
  const returnTo = safeReturn(returnToRaw, "/admin/orders");
  const order = await db.order.findUnique({ where: { id: cleanId(orderId) }, select: { id: true, status: true, eventId: true, reference: true } });
  if (!order) flash(returnTo, "error", "Pedido não encontrado.");
  if (order.status === "APPROVED") flash(returnTo, "error", `O pedido ${order.reference} já estava aprovado.`);
  const now = new Date();
  await db.$transaction([
    db.order.update({ where: { id: order.id }, data: { status: "APPROVED", adminNote: null, reviewedAt: now, reviewedById: admin.id } }),
    // Só define a data de ativação se ainda não estava ativado (mantém a data original).
    db.event.updateMany({ where: { id: order.eventId, activatedAt: null }, data: { activatedAt: now } }),
  ]);
  revalidatePath(`/dashboard/events/${order.eventId}`);
  flash(returnTo, "ok", `Pedido ${order.reference} aprovado. O evento está ativado.`);
}

export async function rejectOrderAction(orderId: string, returnToRaw: string, fd: FormData) {
  const admin = await requireAdmin();
  const returnTo = safeReturn(returnToRaw, "/admin/orders");
  const order = await db.order.findUnique({ where: { id: cleanId(orderId) }, select: { id: true, status: true, eventId: true, reference: true } });
  if (!order) flash(returnTo, "error", "Pedido não encontrado.");
  const adminNote = str(fd, "adminNote", 500);
  if (adminNote.length < 3) flash(returnTo, "error", "Indique o motivo da rejeição (é mostrado ao utilizador).");
  await db.order.update({ where: { id: order.id }, data: { status: "REJECTED", adminNote, reviewedAt: new Date(), reviewedById: admin.id } });
  revalidatePath(`/dashboard/events/${order.eventId}`);
  flash(returnTo, "ok", `Pedido ${order.reference} rejeitado.`);
}

// ---------- Utilizadores ----------

export async function setUserRoleAction(userId: string, role: "ADMIN" | "USER", returnToRaw: string, _fd?: FormData) {
  const admin = await requireAdmin();
  const returnTo = safeReturn(returnToRaw, "/admin/users");
  const id = cleanId(userId);
  if (id === admin.id) flash(returnTo, "error", "Não pode alterar o seu próprio papel.");
  const target = await db.user.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!target) flash(returnTo, "error", "Utilizador não encontrado.");
  await db.user.update({ where: { id }, data: { role: role === "ADMIN" ? "ADMIN" : "USER" } });
  flash(returnTo, "ok", role === "ADMIN" ? `${target.name} passou a administrador.` : `${target.name} deixou de ser administrador.`);
}

export async function toggleSuspendUserAction(userId: string, returnToRaw: string, _fd?: FormData) {
  const admin = await requireAdmin();
  const returnTo = safeReturn(returnToRaw, "/admin/users");
  const id = cleanId(userId);
  if (id === admin.id) flash(returnTo, "error", "Não pode suspender a sua própria conta.");
  const target = await db.user.findUnique({ where: { id }, select: { id: true, name: true, suspendedAt: true } });
  if (!target) flash(returnTo, "error", "Utilizador não encontrado.");
  if (target.suspendedAt) {
    await db.user.update({ where: { id }, data: { suspendedAt: null } });
    flash(returnTo, "ok", `Conta de ${target.name} reativada.`);
  }
  // Suspender: as sessões deixam de funcionar (getCurrentUser) e apagamo-las para libertar espaço.
  await db.$transaction([
    db.user.update({ where: { id }, data: { suspendedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: id } }),
  ]);
  flash(returnTo, "ok", `Conta de ${target.name} suspensa.`);
}

/** Cria um link de recuperação (como o "esqueci-me da palavra-passe") e mostra-o uma única vez na página do utilizador. */
export async function generateResetLinkAction(userId: string, _fd?: FormData) {
  await requireAdmin();
  const id = cleanId(userId);
  const target = await db.user.findUnique({ where: { id }, select: { id: true } });
  if (!target) flash("/admin/users", "error", "Utilizador não encontrado.");
  const token = randomBytes(32).toString("base64url");
  await db.passwordReset.create({ data: { userId: id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + RESET_TTL_MIN * 60_000) } });
  // O token nunca vai no URL: guarda-se em memória e a página troca o identificador pelo link, uma única vez.
  redirect(`/admin/users/${id}?reset=${stashSecret(token)}`);
}

// ---------- Eventos ----------

export async function setEventActivationAction(eventId: string, activate: boolean, returnToRaw: string, _fd?: FormData) {
  await requireAdmin();
  const returnTo = safeReturn(returnToRaw, "/admin/events");
  const id = cleanId(eventId);
  const event = await db.event.findUnique({ where: { id }, select: { id: true, title: true, activatedAt: true } });
  if (!event) flash(returnTo, "error", "Evento não encontrado.");
  await db.event.update({ where: { id }, data: { activatedAt: activate ? (event.activatedAt ?? new Date()) : null } });
  revalidatePath(`/dashboard/events/${id}`);
  flash(returnTo, "ok", activate ? `"${event.title}" ativado manualmente.` : `"${event.title}" desativado.`);
}

// ---------- Templates ----------

export async function saveTemplateSettingsAction(fd: FormData) {
  await requireAdmin();
  const path = "/admin/templates";
  await db.$transaction(
    TEMPLATES.map((t) => {
      const data = {
        enabled: bool(fd, `enabled_${t.id}`),
        premium: bool(fd, `premium_${t.id}`),
        sortOrder: Math.max(-999, Math.min(999, Number.parseInt(str(fd, `sort_${t.id}`, 6), 10) || 0)),
      };
      return db.templateSetting.upsert({ where: { id: t.id }, create: { id: t.id, ...data }, update: data });
    }),
  );
  revalidatePath("/dashboard/invites");
  flash(path, "ok", "Templates atualizados.");
}

// ---------- Definições ----------

export async function updatePlatformSettingsAction(fd: FormData) {
  await requireAdmin();
  const path = "/admin/settings";
  const price = parseMoney(str(fd, "eventPrice", 24));
  if (price == null) flash(path, "error", "Preço inválido. Use por exemplo 15000 ou 1.250,00 (0 para não exigir ativação).");
  const currency = str(fd, "currency", 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) flash(path, "error", "Moeda inválida: use o código de 3 letras (ex.: AOA, EUR).");
  const freeGuestLimit = Number.parseInt(str(fd, "freeGuestLimit", 5), 10);
  if (!Number.isFinite(freeGuestLimit) || freeGuestLimit < 0 || freeGuestLimit > 10_000) flash(path, "error", "Limite de convidados inválido (0 a 10000).");
  const data = {
    eventPrice: price,
    currency,
    bankName: opt(fd, "bankName", 120),
    bankAccount: opt(fd, "bankAccount", 60),
    bankHolder: opt(fd, "bankHolder", 120),
    paymentNote: opt(fd, "paymentNote", 2000),
    freeGuestLimit,
    gatePlanner: bool(fd, "gatePlanner"),
    gateSharing: bool(fd, "gateSharing"),
  };
  await db.platformSettings.upsert({ where: { id: "default" }, create: { id: "default", ...data }, update: data });
  revalidatePath("/dashboard", "layout");
  flash(path, "ok", "Definições guardadas.");
}
