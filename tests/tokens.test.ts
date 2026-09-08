import { describe, expect, it } from "vitest";
import { generateCheckinCode, generateInviteToken, generateOtpCode, hashOtp, verifyOtpHash } from "@/lib/tokens";

describe("tokens", () => {
  it("gera tokens de convite únicos e longos", () => {
    const a = generateInviteToken();
    const b = generateInviteToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
  });
  it("gera códigos de check-in sem caracteres ambíguos", () => {
    for (let i = 0; i < 50; i++) expect(generateCheckinCode()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });
  it("gera OTP de 6 dígitos", () => {
    for (let i = 0; i < 50; i++) expect(generateOtpCode()).toMatch(/^\d{6}$/);
  });
  it("valida o hash do OTP apenas para o mesmo convidado e código", () => {
    const hash = hashOtp("123456", "guest_a");
    expect(verifyOtpHash("123456", "guest_a", hash)).toBe(true);
    expect(verifyOtpHash(" 123456 ", "guest_a", hash)).toBe(true);
    expect(verifyOtpHash("123457", "guest_a", hash)).toBe(false);
    expect(verifyOtpHash("123456", "guest_b", hash)).toBe(false);
  });
});
