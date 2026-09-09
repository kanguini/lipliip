"use server";

import { db } from "@/lib/db";
import { requireEventAccess } from "@/lib/access";
import { planForEvent } from "@/lib/platform";
import { checkUpload, saveDocument } from "@/lib/media";
import { generateOrderReference } from "@/lib/activation";
import { rateLimit } from "@/lib/rate-limit";
import { flash, opt } from "@/lib/form";

/**
 * Envio do comprovativo de transferência para ativar o evento. Cria o pedido (PENDING) ou anexa o comprovativo
 * ao pedido pendente já existente (mantendo a mesma referência). Depois de uma rejeição pode submeter um novo pedido.
 */
export async function submitActivationProofAction(eventId: string, fd: FormData) {
  const { user, event } = await requireEventAccess(eventId);
  const path = `/dashboard/events/${eventId}/activate`;
  const plan = await planForEvent(event);
  if (plan.price <= 0) flash(path, "error", "Não é necessária ativação: a plataforma não cobra pelos eventos neste momento.");
  if (plan.active) flash(path, "ok", "Este evento já está ativado.");
  if (!rateLimit(`activation:${user.id}`, 6, 15 * 60_000).ok) flash(path, "error", "Demasiados envios seguidos. Aguarde alguns minutos e tente de novo.");

  const check = checkUpload(fd.get("proof"), "document");
  if (!check.ok) flash(path, "error", check.error);
  const note = opt(fd, "note", 500);

  let media: { id: string };
  try {
    media = await saveDocument(Buffer.from(await check.file.arrayBuffer()), check.file.type, { userId: user.id, eventId });
  } catch (e) {
    flash(path, "error", (e as Error).message || "Não foi possível guardar o comprovativo.");
  }

  // Uma transação serializável garante um único pedido PENDING por evento, mesmo com submissões simultâneas.
  let outcome: { reference: string; updated: boolean } | null = null;
  for (let attempt = 0; attempt < 5 && !outcome; attempt++) {
    const reference = generateOrderReference();
    try {
      outcome = await db.$transaction(
        async (tx) => {
          const pending = await tx.order.findFirst({ where: { eventId, status: "PENDING" }, orderBy: { createdAt: "desc" } });
          if (pending) {
            await tx.order.update({ where: { id: pending.id }, data: { proofMediaId: media.id, note: note ?? pending.note, amount: plan.price, currency: plan.currency } });
            return { reference: pending.reference, updated: true };
          }
          await tx.order.create({ data: { userId: user.id, eventId, amount: plan.price, currency: plan.currency, reference, status: "PENDING", proofMediaId: media.id, note } });
          return { reference, updated: false };
        },
        { isolationLevel: "Serializable" },
      );
    } catch (e) {
      // P2034 = conflito de serialização (outra submissão ao mesmo tempo); P2002 = colisão de referência.
      const code = (e as { code?: string }).code;
      if ((code !== "P2034" && code !== "P2002") || attempt >= 4) throw e;
    }
  }
  if (!outcome) flash(path, "error", "Não foi possível registar o pedido. Tente de novo.");
  flash(
    path,
    "ok",
    outcome.updated
      ? `Comprovativo atualizado. Referência ${outcome.reference}. Vamos confirmar o pagamento em breve.`
      : `Comprovativo recebido. Referência ${outcome.reference}. Vamos confirmar o pagamento e ativar o evento em breve.`,
  );
}
