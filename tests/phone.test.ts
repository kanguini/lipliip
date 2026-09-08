import { describe, expect, it } from "vitest";
import { maskPhone, normalizePhone, phoneForWhatsApp } from "@/lib/phone";

describe("normalizePhone", () => {
  it("normaliza número nacional português para E.164", () => {
    expect(normalizePhone("912 345 678", "PT")).toBe("+351912345678");
  });
  it("aceita números já internacionais independentemente do país por omissão", () => {
    expect(normalizePhone("+244 923 456 789", "PT")).toBe("+244923456789");
    expect(normalizePhone("00351912345678", "AO")).toBe("+351912345678");
  });
  it("rejeita números inválidos", () => {
    expect(normalizePhone("123", "PT")).toBeNull();
    expect(normalizePhone("", "PT")).toBeNull();
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
