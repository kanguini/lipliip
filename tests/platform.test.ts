import { describe, expect, it } from "vitest";
import type { PlatformSettings } from "@prisma/client";
import { eventPlan } from "@/lib/platform";

function settings(over: Partial<PlatformSettings> = {}): PlatformSettings {
  return {
    id: "default",
    eventPrice: 0,
    currency: "AOA",
    bankName: null,
    bankAccount: null,
    bankHolder: null,
    paymentNote: null,
    freeGuestLimit: 5,
    gatePlanner: false,
    gateSharing: true,
    updatedAt: new Date(),
    ...over,
  };
}

describe("eventPlan", () => {
  it("com preço 0 o evento está sempre ativo e sem limites", () => {
    const plan = eventPlan({ activatedAt: null }, settings({ eventPrice: 0 }));
    expect(plan.active).toBe(true);
    expect(plan.canShare).toBe(true);
    expect(plan.canPlan).toBe(true);
    expect(plan.guestLimit).toBe(Number.POSITIVE_INFINITY);
  });

  it("com preço > 0 e sem ativação aplica o plano gratuito", () => {
    const plan = eventPlan({ activatedAt: null }, settings({ eventPrice: 15000, freeGuestLimit: 7, gateSharing: true, gatePlanner: true }));
    expect(plan.active).toBe(false);
    expect(plan.canShare).toBe(false);
    expect(plan.canPlan).toBe(false);
    expect(plan.guestLimit).toBe(7);
    expect(plan.price).toBe(15000);
    expect(plan.currency).toBe("AOA");
  });

  it("os bloqueios de partilha e planeamento respeitam as definições", () => {
    const plan = eventPlan({ activatedAt: null }, settings({ eventPrice: 100, gateSharing: false, gatePlanner: false }));
    expect(plan.active).toBe(false);
    expect(plan.canShare).toBe(true);
    expect(plan.canPlan).toBe(true);
    expect(plan.guestLimit).toBe(5);
  });

  it("depois da ativação tudo fica disponível", () => {
    const plan = eventPlan({ activatedAt: new Date() }, settings({ eventPrice: 100, gateSharing: true, gatePlanner: true, freeGuestLimit: 2 }));
    expect(plan.active).toBe(true);
    expect(plan.canShare).toBe(true);
    expect(plan.canPlan).toBe(true);
    expect(plan.guestLimit).toBe(Number.POSITIVE_INFINITY);
  });
});
