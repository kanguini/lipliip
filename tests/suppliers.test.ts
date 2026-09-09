import { describe, expect, it } from "vitest";
import {
  ANGOLA_PROVINCES,
  SUPPLIER_CATEGORIES,
  parseCoordinate,
  parseSupplierFilters,
  supplierCategoryLabel,
  supplierExcerpt,
  supplierFiltersQuery,
  supplierLocation,
  supplierMapsUrl,
  supplierTelUrl,
  supplierWhatsappUrl,
} from "@/lib/suppliers";

describe("listas do diretório", () => {
  it("tem as 18 províncias de Angola por ordem alfabética", () => {
    expect(ANGOLA_PROVINCES).toHaveLength(18);
    expect(ANGOLA_PROVINCES).toContain("Luanda");
    expect(ANGOLA_PROVINCES[0]).toBe("Bengo");
    expect(ANGOLA_PROVINCES[17]).toBe("Zaire");
  });
  it("tem 13 categorias com ids únicos", () => {
    expect(SUPPLIER_CATEGORIES).toHaveLength(13);
    expect(new Set(SUPPLIER_CATEGORIES.map((c) => c.id)).size).toBe(13);
    expect(supplierCategoryLabel("VENUE")).toBe("Salões e espaços");
    expect(supplierCategoryLabel("XPTO")).toBe("XPTO");
    expect(supplierCategoryLabel(null)).toBe("Outros");
  });
});

describe("parseSupplierFilters", () => {
  it("só aceita categorias e províncias conhecidas e apara a pesquisa", () => {
    expect(parseSupplierFilters({ category: "MUSIC", province: "Huíla", q: "  dj   marco " })).toEqual({ category: "MUSIC", province: "Huíla", q: "dj marco" });
    expect(parseSupplierFilters({ category: "hack", province: "Lisboa", q: "x".repeat(200) })).toEqual({ category: null, province: null, q: "x".repeat(80) });
    expect(parseSupplierFilters(undefined)).toEqual({ category: null, province: null, q: "" });
  });
  it("gera a query string só com os filtros definidos", () => {
    expect(supplierFiltersQuery({ category: null, province: null, q: "" })).toBe("");
    expect(supplierFiltersQuery({ category: "CATERING", q: "bolo" })).toBe("?category=CATERING&q=bolo");
  });
});

describe("localização e mapa", () => {
  it("compõe cidade e província sem repetir", () => {
    expect(supplierLocation({ city: "Talatona", province: "Luanda" })).toBe("Talatona, Luanda");
    expect(supplierLocation({ city: "Luanda", province: "Luanda" })).toBe("Luanda");
    expect(supplierLocation({ city: null, province: "Benguela" })).toBe("Benguela");
    expect(supplierLocation({})).toBe("");
  });
  it("prefere coordenadas e, sem elas, pesquisa pela morada", () => {
    expect(supplierMapsUrl({ lat: -8.83, lng: 13.23, address: "Rua X" })).toBe("https://www.google.com/maps/search/?api=1&query=-8.83%2C13.23");
    expect(supplierMapsUrl({ address: "Rua da Missão 12", city: "Luanda" })).toBe("https://www.google.com/maps/search/?api=1&query=Rua%20da%20Miss%C3%A3o%2012%2C%20Luanda%2C%20Angola");
    expect(supplierMapsUrl({})).toBeNull();
  });
  it("valida coordenadas", () => {
    expect(parseCoordinate("-8,838", "lat")).toBe(-8.838);
    expect(parseCoordinate("", "lat")).toBeNull();
    expect(parseCoordinate("abc", "lat")).toBeUndefined();
    expect(parseCoordinate("200", "lng")).toBeUndefined();
  });
});

describe("contactos", () => {
  it("gera links wa.me com indicativo de Angola por omissão", () => {
    expect(supplierWhatsappUrl("923 000 000")).toBe("https://wa.me/244923000000");
    expect(supplierWhatsappUrl("+244 923 000 000", "Olá")).toBe("https://wa.me/244923000000?text=Ol%C3%A1");
    expect(supplierWhatsappUrl("00351912345678")).toBe("https://wa.me/351912345678");
    expect(supplierWhatsappUrl("12")).toBeNull();
    expect(supplierWhatsappUrl(null)).toBeNull();
  });
  it("gera links tel:", () => {
    expect(supplierTelUrl("+244 923 000 000")).toBe("tel:+244923000000");
    expect(supplierTelUrl("923-000-000")).toBe("tel:923000000");
    expect(supplierTelUrl("12")).toBeNull();
  });
});

describe("supplierExcerpt", () => {
  it("corta em palavra inteira e acrescenta reticências", () => {
    const text = "Salão com capacidade para 300 pessoas, estacionamento amplo, ar condicionado e catering próprio para todo o tipo de festas e cerimónias.";
    const out = supplierExcerpt(text, 60);
    expect(out.length).toBeLessThanOrEqual(61);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toContain(",…");
    expect(supplierExcerpt("curto")).toBe("curto");
    expect(supplierExcerpt(null)).toBe("");
  });
});
