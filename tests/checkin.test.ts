import { describe, expect, it } from "vitest";
import {
  checkinExtra,
  generateReceptionPin,
  generateReceptionToken,
  hashReceptionPin,
  isReceptionCookieValid,
  matchesGuestQuery,
  normalizeCheckinCode,
  receptionCookieName,
  receptionCookieValue,
  verifyReceptionPin,
} from "@/lib/checkin";

describe("normalizeCheckinCode", () => {
  it("põe em maiúsculas e remove espaços e símbolos", () => {
    expect(normalizeCheckinCode(" k7pm-2q ")).toBe("K7PM2Q");
    expect(normalizeCheckinCode("k7 pm 2q")).toBe("K7PM2Q");
  });
  it("devolve vazio para valores nulos ou sem caracteres válidos", () => {
    expect(normalizeCheckinCode(null)).toBe("");
    expect(normalizeCheckinCode(undefined)).toBe("");
    expect(normalizeCheckinCode("---")).toBe("");
  });
  it("limita a 12 caracteres", () => {
    expect(normalizeCheckinCode("ABCDEFGHJKLMNPQRST")).toBe("ABCDEFGHJKLM");
  });
});

describe("checkinExtra", () => {
  it("indica acompanhantes e mesa para quem confirmou", () => {
    expect(checkinExtra({ rsvpStatus: "ACCEPTED", companions: 2, tableNumber: "7" })).toBe(" +2 acompanhante(s) · mesa 7");
    expect(checkinExtra({ rsvpStatus: "ACCEPTED", companions: 0, tableNumber: null })).toBe("");
  });
  it("avisa quando não tinha confirmado presença", () => {
    expect(checkinExtra({ rsvpStatus: "PENDING", companions: 3, tableNumber: "1" })).toBe(" (não tinha confirmado presença)");
  });
});

describe("acesso da receção", () => {
  it("gera tokens de 32 caracteres base64url e PINs de 4 dígitos", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateReceptionToken()).toMatch(/^[A-Za-z0-9_-]{32}$/);
      expect(generateReceptionPin()).toMatch(/^\d{4}$/);
    }
    expect(generateReceptionToken()).not.toBe(generateReceptionToken());
  });
  it("valida o PIN contra o hash guardado", () => {
    const hash = hashReceptionPin("0420");
    expect(verifyReceptionPin("0420", hash)).toBe(true);
    expect(verifyReceptionPin(" 0420 ", hash)).toBe(true);
    expect(verifyReceptionPin("0421", hash)).toBe(false);
    expect(verifyReceptionPin("420", hash)).toBe(false);
  });
  it("o cookie depende do hash do PIN e do token e é invalidado ao mudar qualquer um", () => {
    const hash = hashReceptionPin("1234");
    const token = generateReceptionToken();
    const cookie = receptionCookieValue(hash, token);
    expect(cookie).toMatch(/^[a-f0-9]{64}$/);
    expect(isReceptionCookieValid(cookie, hash, token)).toBe(true);
    expect(isReceptionCookieValid(cookie, hashReceptionPin("9999"), token)).toBe(false);
    expect(isReceptionCookieValid(cookie, hash, generateReceptionToken())).toBe(false);
    expect(isReceptionCookieValid(cookie, null, token)).toBe(false);
    expect(isReceptionCookieValid(cookie, hash, null)).toBe(false);
    expect(isReceptionCookieValid(undefined, hash, token)).toBe(false);
    expect(isReceptionCookieValid("abc", hash, token)).toBe(false);
  });
  it("nomeia o cookie pelo evento", () => {
    expect(receptionCookieName("ev_1")).toBe("lp_r_ev_1");
  });
});

describe("matchesGuestQuery", () => {
  const guest = { name: "Ana Maria Silva", checkinCode: "K7PM2Q" };
  it("aceita tudo sem pesquisa", () => {
    expect(matchesGuestQuery(guest, "")).toBe(true);
    expect(matchesGuestQuery(guest, "   ")).toBe(true);
  });
  it("pesquisa por parte do nome ou pelo código, sem distinguir maiúsculas", () => {
    expect(matchesGuestQuery(guest, "maria")).toBe(true);
    expect(matchesGuestQuery(guest, "k7pm")).toBe(true);
    expect(matchesGuestQuery(guest, "k7 pm 2q")).toBe(true);
    expect(matchesGuestQuery(guest, "joão")).toBe(false);
  });
});
