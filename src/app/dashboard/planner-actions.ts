"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireEventAccess } from "@/lib/access";
import { buildChecklist } from "@/lib/checklists";
import { localInputToDate } from "@/lib/timezone";
import { httpUrlOrNull } from "@/lib/validation";
import { VENDOR_STATUS } from "@/lib/checklists";
import { flash, str, opt, parseMoney } from "@/lib/form";

const num = (fd: FormData, k: string) => parseMoney(str(fd, k, 24));
const VENDOR_STATUSES = Object.keys(VENDOR_STATUS);

// ---------- Tarefas ----------

export async function addTaskAction(eventId: string, fd: FormData) {
  const { event } = await requireEventAccess(eventId);
  const path = `/dashboard/events/${eventId}/tasks`;
  const title = str(fd, "title", 160);
  if (title.length < 2) flash(path, "error", "Indique a tarefa.");
  const due = str(fd, "dueAt", 10);
  await db.task.create({
    data: {
      eventId,
      title,
      category: opt(fd, "category", 40),
      assignee: opt(fd, "assignee", 80),
      dueAt: due ? localInputToDate(`${due}T12:00`, event.timezone) : null,
      sortOrder: 1000,
    },
  });
  flash(path, "ok", "Tarefa adicionada.");
}

export async function toggleTaskAction(eventId: string, taskId: string) {
  await requireEventAccess(eventId);
  const task = await db.task.findFirst({ where: { id: taskId, eventId } });
  if (!task) return;
  await db.task.update({ where: { id: taskId }, data: { completedAt: task.completedAt ? null : new Date() } });
  revalidatePath(`/dashboard/events/${eventId}/tasks`);
  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function deleteTaskAction(eventId: string, taskId: string) {
  await requireEventAccess(eventId);
  await db.task.deleteMany({ where: { id: taskId, eventId } });
  revalidatePath(`/dashboard/events/${eventId}/tasks`);
}

/** Acrescenta as tarefas da checklist padrão que ainda não existem (por título). */
export async function generateChecklistAction(eventId: string) {
  const { event } = await requireEventAccess(eventId);
  const path = `/dashboard/events/${eventId}/tasks`;
  const existing = new Set((await db.task.findMany({ where: { eventId }, select: { title: true } })).map((t) => t.title));
  const missing = buildChecklist(event.type, event.date).filter((t) => !existing.has(t.title));
  if (missing.length) await db.task.createMany({ data: missing.map((t) => ({ ...t, eventId })) });
  flash(path, "ok", missing.length ? `${missing.length} tarefa(s) adicionada(s) à checklist.` : "A checklist já está completa.");
}

// ---------- Fornecedores ----------

export async function addVendorAction(eventId: string, fd: FormData) {
  await requireEventAccess(eventId);
  const path = `/dashboard/events/${eventId}/vendors`;
  const name = str(fd, "name", 120);
  if (name.length < 2) flash(path, "error", "Indique o nome do fornecedor.");
  await db.vendor.create({
    data: {
      eventId,
      name,
      category: str(fd, "category", 40) || "Outros",
      contactName: opt(fd, "contactName", 80),
      phone: opt(fd, "phone", 30),
      email: opt(fd, "email", 120),
      website: httpUrlOrNull(str(fd, "website", 300)),
      price: num(fd, "price"),
      status: VENDOR_STATUSES.includes(str(fd, "status", 20)) ? str(fd, "status", 20) : "CONTACTING",
      notes: opt(fd, "notes", 1000),
    },
  });
  flash(path, "ok", "Fornecedor adicionado.");
}

export async function updateVendorAction(eventId: string, vendorId: string, fd: FormData) {
  await requireEventAccess(eventId);
  const path = `/dashboard/events/${eventId}/vendors`;
  const vendor = await db.vendor.findFirst({ where: { id: vendorId, eventId } });
  if (!vendor) flash(path, "error", "Fornecedor não encontrado.");
  const status = str(fd, "status", 20);
  if (fd.has("price") && str(fd, "price", 24) && num(fd, "price") == null) flash(path, "error", "Valor inválido. Use por exemplo 2500 ou 1.250,00.");
  const data = {
    status: VENDOR_STATUSES.includes(status) ? status : vendor.status,
    price: fd.has("price") ? num(fd, "price") : vendor.price,
    notes: fd.has("notes") ? opt(fd, "notes", 1000) : vendor.notes,
  };
  await db.$transaction(async (tx) => {
    await tx.vendor.update({ where: { id: vendorId }, data });
    const item = await tx.budgetItem.findFirst({ where: { eventId, vendorId }, include: { payments: true } });
    if (data.status === "HIRED" && data.price != null) {
      // Ao contratar, cria (ou atualiza) a linha do orçamento com o valor fechado.
      if (item) await tx.budgetItem.update({ where: { id: item.id }, data: { contracted: data.price } });
      else await tx.budgetItem.create({ data: { eventId, category: vendor.category, name: vendor.name, estimated: data.price, contracted: data.price, vendorId } });
    } else if (item && vendor.status === "HIRED" && data.status !== "HIRED") {
      // Deixou de estar contratado: a linha automática sem pagamentos desaparece; com pagamentos fica só como estimativa.
      if (item.payments.length === 0) await tx.budgetItem.delete({ where: { id: item.id } });
      else await tx.budgetItem.update({ where: { id: item.id }, data: { contracted: null } });
    }
  });
  revalidatePath(path);
  revalidatePath(`/dashboard/events/${eventId}/budget`);
  redirect(path);
}

export async function deleteVendorAction(eventId: string, vendorId: string) {
  await requireEventAccess(eventId);
  await db.$transaction(async (tx) => {
    // Linhas de orçamento criadas automaticamente por este fornecedor e sem pagamentos vão com ele.
    const items = await tx.budgetItem.findMany({ where: { eventId, vendorId }, include: { payments: true } });
    for (const item of items) {
      if (item.payments.length === 0) await tx.budgetItem.delete({ where: { id: item.id } });
      else await tx.budgetItem.update({ where: { id: item.id }, data: { contracted: null } });
    }
    await tx.vendor.deleteMany({ where: { id: vendorId, eventId } });
  });
  flash(`/dashboard/events/${eventId}/vendors`, "ok", "Fornecedor removido.");
}

// ---------- Orçamento ----------

export async function addBudgetItemAction(eventId: string, fd: FormData) {
  await requireEventAccess(eventId);
  const path = `/dashboard/events/${eventId}/budget`;
  const name = str(fd, "name", 120);
  if (name.length < 2) flash(path, "error", "Indique o item.");
  const vendorId = opt(fd, "vendorId", 40);
  await db.budgetItem.create({
    data: {
      eventId,
      name,
      category: str(fd, "category", 40) || "Outros",
      estimated: num(fd, "estimated") ?? 0,
      contracted: num(fd, "contracted"),
      vendorId: vendorId ? (await db.vendor.findFirst({ where: { id: vendorId, eventId } }))?.id ?? null : null,
      notes: opt(fd, "notes", 500),
    },
  });
  flash(path, "ok", "Item adicionado ao orçamento.");
}

export async function updateBudgetItemAction(eventId: string, itemId: string, fd: FormData) {
  await requireEventAccess(eventId);
  const path = `/dashboard/events/${eventId}/budget`;
  await db.budgetItem.updateMany({
    where: { id: itemId, eventId },
    data: { estimated: num(fd, "estimated") ?? 0, contracted: num(fd, "contracted") },
  });
  revalidatePath(path);
  redirect(path);
}

export async function deleteBudgetItemAction(eventId: string, itemId: string) {
  await requireEventAccess(eventId);
  await db.budgetItem.deleteMany({ where: { id: itemId, eventId } });
  flash(`/dashboard/events/${eventId}/budget`, "ok", "Item removido.");
}

export async function addPaymentAction(eventId: string, itemId: string, fd: FormData) {
  const { event } = await requireEventAccess(eventId);
  const path = `/dashboard/events/${eventId}/budget`;
  const item = await db.budgetItem.findFirst({ where: { id: itemId, eventId } });
  if (!item) flash(path, "error", "Item não encontrado.");
  const amount = num(fd, "amount");
  if (!amount) flash(path, "error", "Indique o valor do pagamento (ex.: 500 ou 1.250,00).");
  const due = str(fd, "dueAt", 10);
  await db.payment.create({
    data: {
      budgetItemId: itemId,
      amount,
      label: opt(fd, "label", 60),
      dueAt: due ? localInputToDate(`${due}T12:00`, event.timezone) : null,
      paidAt: fd.get("paid") === "on" ? new Date() : null,
    },
  });
  flash(path, "ok", "Pagamento registado.");
}

export async function togglePaymentAction(eventId: string, paymentId: string) {
  await requireEventAccess(eventId);
  const payment = await db.payment.findFirst({ where: { id: paymentId, budgetItem: { eventId } } });
  if (!payment) return;
  await db.payment.update({ where: { id: paymentId }, data: { paidAt: payment.paidAt ? null : new Date() } });
  revalidatePath(`/dashboard/events/${eventId}/budget`);
  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function deletePaymentAction(eventId: string, paymentId: string) {
  await requireEventAccess(eventId);
  await db.payment.deleteMany({ where: { id: paymentId, budgetItem: { eventId } } });
  revalidatePath(`/dashboard/events/${eventId}/budget`);
}

// ---------- Equipa ----------

export async function addMemberAction(eventId: string, fd: FormData) {
  const { user } = await requireEventAccess(eventId, { ownerOnly: true });
  const path = `/dashboard/events/${eventId}/team`;
  const email = str(fd, "email", 120).toLowerCase();
  const role = str(fd, "role", 10) === "STAFF" ? "STAFF" : "EDITOR";
  const target = await db.user.findUnique({ where: { email } });
  // Mensagem neutra: não confirma se o email tem conta.
  if (!target) flash(path, "error", "Não foi possível dar acesso a este email. A pessoa precisa de ter conta na plataforma com exatamente este email; peça-lhe para se registar e tente de novo.");
  if (target.id === user.id) flash(path, "error", "Já é o dono deste evento.");
  await db.eventMember.upsert({
    where: { eventId_userId: { eventId, userId: target.id } },
    create: { eventId, userId: target.id, role },
    update: { role },
  });
  flash(path, "ok", `${target.name} passou a ter acesso como ${role === "STAFF" ? "receção" : "editor"}.`);
}

export async function removeMemberAction(eventId: string, memberId: string) {
  await requireEventAccess(eventId, { ownerOnly: true });
  await db.eventMember.deleteMany({ where: { id: memberId, eventId } });
  flash(`/dashboard/events/${eventId}/team`, "ok", "Acesso removido.");
}

/** Um membro pode sair do evento por iniciativa própria. */
export async function leaveEventAction(eventId: string) {
  const { user, role } = await requireEventAccess(eventId, { allowStaff: true });
  if (role === "OWNER") flash(`/dashboard/events/${eventId}/team`, "error", "O dono não pode sair do próprio evento.");
  await db.eventMember.deleteMany({ where: { eventId, userId: user.id } });
  redirect("/dashboard?ok=" + encodeURIComponent("Saiu do evento."));
}
