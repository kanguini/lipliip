import { describe, expect, it } from "vitest";
import { CURRENCIES, DEFAULT_CURRENCY, formatMoney } from "@/lib/format";

const nbsp = (s: string) => s.replace(/[  ]/g, " ");

describe("formatMoney", () => {
  it("mostra o Kwanza com o símbolo Kz em vez do código", () => {
    expect(nbsp(formatMoney(1234.5, "AOA"))).toBe("1234,50 Kz");
    expect(nbsp(formatMoney(1234.5, "aoa"))).toBe("1234,50 Kz");
    expect(nbsp(formatMoney(0, "AOA"))).toBe("0,00 Kz");
  });
  it("usa o Intl para moedas conhecidas", () => {
    expect(nbsp(formatMoney(1234.5, "EUR"))).toBe("1234,50 €");
    expect(nbsp(formatMoney(10, "USD"))).toContain("10,00");
  });
  it("não rebenta com códigos desconhecidos", () => {
    expect(formatMoney(5, "XXXX")).toContain("5");
  });
  it("Kwanza é a moeda por omissão e a primeira da lista", () => {
    expect(DEFAULT_CURRENCY).toBe("AOA");
    expect(CURRENCIES[0].code).toBe("AOA");
    expect(nbsp(formatMoney(99.9))).toBe("99,90 Kz");
  });
});
