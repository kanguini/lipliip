import { cache } from "react";
import type { Event, PlatformSettings } from "@prisma/client";
import { db } from "./db";

/** Configuração global (preço, dados bancários, limites do plano gratuito). Cria a linha por omissão se não existir. */
export const getPlatformSettings = cache(async (): Promise<PlatformSettings> => {
  const existing = await db.platformSettings.findUnique({ where: { id: "default" } });
  if (existing) return existing;
  return db.platformSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
});

export type EventPlan = {
  /** Evento ativado (pago e libertado) ou ativação não exigida pela plataforma. */
  active: boolean;
  /** Pode enviar/partilhar convites e os convidados podem abri-los. */
  canShare: boolean;
  /** Pode usar tarefas, orçamento e fornecedores. */
  canPlan: boolean;
  /** Convidados que ainda pode adicionar (Infinity quando ativo). */
  guestLimit: number;
  price: number;
  currency: string;
};

/**
 * O que o evento pode fazer no seu estado atual. Com preço 0 a plataforma não exige ativação.
 * Antes da ativação o anfitrião cria o convite e prepara tudo; o envio (e a abertura pelos convidados)
 * fica para depois do pagamento, com um pequeno número de convidados para testar.
 */
export function eventPlan(event: Pick<Event, "activatedAt">, settings: PlatformSettings): EventPlan {
  const required = settings.eventPrice > 0;
  const active = !required || !!event.activatedAt;
  return {
    active,
    canShare: active || !settings.gateSharing,
    canPlan: active || !settings.gatePlanner,
    guestLimit: active ? Number.POSITIVE_INFINITY : settings.freeGuestLimit,
    price: settings.eventPrice,
    currency: settings.currency,
  };
}

export async function planForEvent(event: Pick<Event, "activatedAt">): Promise<EventPlan> {
  return eventPlan(event, await getPlatformSettings());
}
