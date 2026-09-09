import { describe, expect, it } from "vitest";
import { DEFAULT_COUNTRY, SUPPORTED_COUNTRIES, isSupportedCountry, maskPhone, normalizePhone, phoneForWhatsApp } from "@/lib/phone";

describe("normalizePhone", () => {
  it("normaliza número nacional português para E.164", () => {
    expect(normalizePhone("912 345 678", "PT")).toBe("+351912345678");
  });
  it("interpreta números sem indicativo no país por omissão (Angola)", () => {
    expect(normalizePhone("923456789", "AO")).toBe("+244923456789");
    expect(normalizePhone("923 456 789")).toBe("+244923456789");
    expect(DEFAULT_COUNTRY).toBe("AO");
  });
  it("aceita números já internacionais independentemente do país por omissão", () => {
    expect(normalizePhone("+351912345678", "AO")).toBe("+351912345678");
    expect(normalizePhone("+244 923 456 789", "PT")).toBe("+244923456789");
    expect(normalizePhone("00351912345678", "AO")).toBe("+351912345678");
    expect(normalizePhone("+55 11 91234-5678", "AO")).toBe("+5511912345678");
    expect(normalizePhone("+1 (415) 555-2671", "AO")).toBe("+14155552671");
  });
  it("aceita números de países fora da lista desde que tenham indicativo", () => {
    expect(normalizePhone("+41 44 668 18 00", "AO")).toBe("+41446681800");
  });
  it("rejeita números inválidos", () => {
    expect(normalizePhone("123", "PT")).toBeNull();
    expect(normalizePhone("", "PT")).toBeNull();
  });
});

describe("SUPPORTED_COUNTRIES", () => {
  it("começa por Angola e tem etiquetas com indicativo", () => {
    expect(SUPPORTED_COUNTRIES[0]).toEqual({ code: "AO", label: "Angola (+244)" });
    for (const c of SUPPORTED_COUNTRIES) expect(c.label).toMatch(/\(\+\d+\)$/);
    expect(new Set(SUPPORTED_COUNTRIES.map((c) => c.code)).size).toBe(SUPPORTED_COUNTRIES.length);
    expect(isSupportedCountry("CN")).toBe(true);
    expect(isSupportedCountry("XX")).toBe(false);
  });
});

describe("maskPhone", () => {
  it("mostra só os últimos 3 dígitos", () => {
    const masked = maskPhone("+351912345678");
    expect(masked.startsWith("+351")).toBe(true);
    expect(masked.endsWith("678")).toBe(true);
    expect(masked).not.toContain("912345");
  });
});

describe("phoneForWhatsApp", () => {
  it("remove o sinal +", () => {
    expect(phoneForWhatsApp("+351912345678")).toBe("351912345678");
  });
});
