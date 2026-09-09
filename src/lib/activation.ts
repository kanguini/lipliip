import { randomInt } from "node:crypto";

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I para ser fácil de copiar para a transferência
export const ORDER_REFERENCE_RE = /^LP-[A-Z0-9]{6}$/;

/** Referência a indicar na transferência bancária, ex.: "LP-K7PM2Q". A unicidade é garantida pela coluna Order.reference. */
export function generateOrderReference(): string {
  let out = "LP-";
  for (let i = 0; i < 6; i++) out += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return out;
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "Em análise",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
};

export const ORDER_STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-[#f8f0de] text-[#8b6b2d]",
  APPROVED: "bg-[#e9f2eb] text-[#416c4a]",
  REJECTED: "bg-[#f4e8eb] text-[#97596a]",
};

/** Estado da ativação de um evento, a partir do plano e do pedido pendente/último pedido. */
export type ActivationState = "ACTIVE" | "NOT_REQUIRED" | "PENDING" | "REJECTED" | "NOT_REQUESTED";

export function activationState(plan: { active: boolean; price: number }, lastOrder: { status: string } | null): ActivationState {
  if (plan.price <= 0) return "NOT_REQUIRED";
  if (plan.active) return "ACTIVE";
  if (lastOrder?.status === "PENDING") return "PENDING";
  if (lastOrder?.status === "REJECTED") return "REJECTED";
  return "NOT_REQUESTED";
}
