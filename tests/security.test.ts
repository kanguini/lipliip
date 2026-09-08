import { describe, expect, it } from "vitest";
import { csvSafe, httpUrlOrNull } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { dateToLocalInput, localInputToDate } from "@/lib/timezone";

describe("httpUrlOrNull", () => {
  it("aceita http(s) e rejeita outros esquemas", () => {
    expect(httpUrlOrNull("https://loja.pt/x")).toBe("https://loja.pt/x");
    expect(httpUrlOrNull("javascript:alert(1)")).toBeNull();
    expect(httpUrlOrNull("data:text/html,x")).toBeNull();
    expect(httpUrlOrNull("loja.pt")).toBeNull();
    expect(httpUrlOrNull("")).toBeNull();
  });
});

describe("csvSafe", () => {
  it("neutraliza fórmulas", () => {
    expect(csvSafe("=1+1")).toBe("'=1+1");
    expect(csvSafe("+351")).toBe("'+351");
    expect(csvSafe("Ana")).toBe("Ana");
  });
});

describe("rateLimit", () => {
  it("bloqueia depois do máximo dentro da janela", () => {
    const key = "t:" + Math.random();
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    const third = rateLimit(key, 2, 60_000);
    expect(third.ok).toBe(false);
    expect(third.retryAfterSec).toBeGreaterThan(0);
  });
});

describe("fuso horário", () => {
  it("converte hora local de Lisboa (verão, UTC+1) para UTC e volta", () => {
    const d = localInputToDate("2027-06-14T15:00", "Europe/Lisbon")!;
    expect(d.toISOString()).toBe("2027-06-14T14:00:00.000Z");
    expect(dateToLocalInput(d, "Europe/Lisbon")).toBe("2027-06-14T15:00");
  });
  it("converte hora local de Luanda (UTC+1 fixo) e São Paulo (UTC-3)", () => {
    expect(localInputToDate("2027-01-10T20:00", "Africa/Luanda")!.toISOString()).toBe("2027-01-10T19:00:00.000Z");
    expect(localInputToDate("2027-01-10T20:00", "America/Sao_Paulo")!.toISOString()).toBe("2027-01-10T23:00:00.000Z");
  });
  it("rejeita entradas inválidas", () => {
    expect(localInputToDate("abc", "Europe/Lisbon")).toBeNull();
  });
});
