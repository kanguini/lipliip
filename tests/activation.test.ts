import { describe, expect, it } from "vitest";
import { activationState, generateOrderReference, ORDER_REFERENCE_RE } from "@/lib/activation";
import { mergeTemplateSettings } from "@/lib/templates-settings";
import { TEMPLATES } from "@/lib/templates";

describe("generateOrderReference", () => {
  it("tem o formato LP-XXXXXX e varia entre chamadas", () => {
    const refs = new Set(Array.from({ length: 50 }, () => generateOrderReference()));
    for (const r of refs) expect(r).toMatch(ORDER_REFERENCE_RE);
    expect(refs.size).toBeGreaterThan(40);
  });
});

describe("activationState", () => {
  it("distingue os estados", () => {
    expect(activationState({ active: true, price: 0 }, null)).toBe("NOT_REQUIRED");
    expect(activationState({ active: true, price: 10 }, null)).toBe("ACTIVE");
    expect(activationState({ active: false, price: 10 }, { status: "PENDING" })).toBe("PENDING");
    expect(activationState({ active: false, price: 10 }, { status: "REJECTED" })).toBe("REJECTED");
    expect(activationState({ active: false, price: 10 }, null)).toBe("NOT_REQUESTED");
  });
});

describe("mergeTemplateSettings", () => {
  it("usa valores por omissão quando não há linha guardada", () => {
    const merged = mergeTemplateSettings(TEMPLATES, []);
    expect(merged).toHaveLength(TEMPLATES.length);
    expect(merged.map((t) => t.id)).toEqual(TEMPLATES.map((t) => t.id));
    expect(merged.every((t) => t.enabled && !t.premium && t.sortOrder === 0)).toBe(true);
  });
  it("aplica enabled/premium e ordena por sortOrder mantendo a ordem do catálogo em empate", () => {
    const merged = mergeTemplateSettings(TEMPLATES, [
      { id: "classic", enabled: false, premium: true, sortOrder: -1 },
      { id: "rubi", enabled: true, premium: false, sortOrder: 5 },
    ]);
    expect(merged[0].id).toBe("classic");
    expect(merged[0].enabled).toBe(false);
    expect(merged[0].premium).toBe(true);
    expect(merged[merged.length - 1].id).toBe("rubi");
    const rest = merged.slice(1, -1).map((t) => t.id);
    expect(rest).toEqual(TEMPLATES.map((t) => t.id).filter((id) => id !== "classic" && id !== "rubi"));
  });
});
