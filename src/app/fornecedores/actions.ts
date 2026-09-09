"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { accessibleEventWhere } from "@/lib/access";
import { requestMeta } from "@/lib/guest-access";
import { rateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/phone";
import { flash, opt, str } from "@/lib/form";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Pedido de orçamento a um fornecedor do diretório. Pode ser feito sem conta; limitado a 5 por hora por ligação. */
export async function requestQuoteAction(supplierId: string, fd: FormData) {
  const path = `/fornecedores/${encodeURIComponent(supplierId)}`;
  const supplier = await db.supplier.findFirst({ where: { id: supplierId, active: true }, select: { id: true, name: true } });
  if (!supplier) flash("/fornecedores", "error", "Este fornecedor já não está disponível.");

  const name = str(fd, "name", 80);
  if (name.length < 2) flash(path, "error", "Indique o seu nome.");
  const phone = normalizePhone(str(fd, "phone", 30), "AO");
  if (!phone) flash(path, "error", "Telemóvel inválido. Use por exemplo +244 923 000 000.");
  const email = opt(fd, "email", 120);
  if (email && !EMAIL.test(email)) flash(path, "error", "Email inválido.");
  const message = str(fd, "message", 1500);
  if (message.length < 10) flash(path, "error", "Descreva o que precisa (data, número de convidados, local…).");
  // O limite só conta pedidos válidos, para um engano no formulário não bloquear a pessoa durante uma hora.
  const meta = await requestMeta();
  if (!rateLimit(`quote:${meta.ip ?? "?"}`, 5, 60 * 60_000).ok) flash(path, "error", "Demasiados pedidos a partir desta ligação. Tente novamente dentro de uma hora.");

  const user = await getCurrentUser();
  let eventId: string | null = null;
  const requestedEvent = str(fd, "eventId", 40);
  if (user && requestedEvent) {
    const ev = await db.event.findFirst({ where: { id: requestedEvent, ...accessibleEventWhere(user.id) }, select: { id: true } });
    eventId = ev?.id ?? null;
  }

  await db.serviceRequest.create({
    data: { supplierId: supplier.id, userId: user?.id ?? null, eventId, name, phone, email, message },
  });
  redirect(`${path}?ok=${encodeURIComponent(`Pedido enviado a ${supplier.name}. Será contactado em breve.`)}#orcamento`);
}
