import { describe, expect, it } from "vitest";
import { DEFAULT_MAP_CENTER, TtlCache, directionsUrl, geoCacheKey, hasCoordinates, normalizeGeoQuery, normalizeNominatimResults, parseCoordinate, parseLatLng } from "@/lib/geo";

describe("parseCoordinate", () => {
  it("lê números com ponto ou vírgula e arredonda a 6 casas", () => {
    expect(parseCoordinate("-8.8390001234", "lat")).toBe(-8.839);
    expect(parseCoordinate("13,289", "lng")).toBe(13.289);
    expect(parseCoordinate(" 0 ", "lat")).toBe(0);
  });
  it("devolve null para vazio, texto ou fora do intervalo", () => {
    expect(parseCoordinate("", "lat")).toBeNull();
    expect(parseCoordinate(null, "lat")).toBeNull();
    expect(parseCoordinate("abc", "lat")).toBeNull();
    expect(parseCoordinate("91", "lat")).toBeNull();
    expect(parseCoordinate("-181", "lng")).toBeNull();
    expect(parseCoordinate("180", "lng")).toBe(180);
  });
});

describe("parseLatLng", () => {
  it("exige as duas coordenadas", () => {
    expect(parseLatLng("-8.839", "13.289")).toEqual({ lat: -8.839, lng: 13.289 });
    expect(parseLatLng("-8.839", "")).toBeNull();
    expect(parseLatLng("", "")).toBeNull();
    expect(parseLatLng("95", "13")).toBeNull();
  });
});

describe("hasCoordinates / directionsUrl", () => {
  it("reconhece eventos com coordenadas", () => {
    expect(hasCoordinates({ venueLat: -8.839, venueLng: 13.289 })).toBe(true);
    expect(hasCoordinates({ venueLat: null, venueLng: 13.289 })).toBe(false);
    expect(hasCoordinates({})).toBe(false);
  });
  it("gera o link de navegação do Google Maps", () => {
    expect(directionsUrl(DEFAULT_MAP_CENTER)).toBe("https://www.google.com/maps/dir/?api=1&destination=-8.839000,13.289000");
  });
});

describe("normalizeNominatimResults", () => {
  it("converte a resposta do Nominatim e ignora entradas malformadas", () => {
    const raw = [
      { display_name: "Luanda, Angola", lat: "-8.8383", lon: "13.2344" },
      { display_name: "Sem coordenadas" },
      { display_name: "", lat: "1", lon: "1" },
      { display_name: "Fora do mapa", lat: "999", lon: "0" },
      null,
      { display_name: "Benguela, Angola", lat: -12.5763, lon: 13.4055 },
    ];
    expect(normalizeNominatimResults(raw)).toEqual([
      { label: "Luanda, Angola", lat: -8.8383, lng: 13.2344 },
      { label: "Benguela, Angola", lat: -12.5763, lng: 13.4055 },
    ]);
  });
  it("devolve lista vazia para respostas inesperadas e respeita o limite", () => {
    expect(normalizeNominatimResults({ error: "x" })).toEqual([]);
    expect(normalizeNominatimResults("nope")).toEqual([]);
    const many = Array.from({ length: 10 }, (_, i) => ({ display_name: `Local ${i}`, lat: "1", lon: "2" }));
    expect(normalizeNominatimResults(many, 5)).toHaveLength(5);
  });
});

describe("pesquisa e cache", () => {
  it("normaliza a pesquisa e a chave da cache", () => {
    expect(normalizeGeoQuery("  Hotel   Epic  Sana \n Luanda ")).toBe("Hotel Epic Sana Luanda");
    expect(geoCacheKey("Hotel EPIC  Sana")).toBe(geoCacheKey("hotel epic sana"));
    expect(normalizeGeoQuery("a".repeat(300))).toHaveLength(200);
  });
  it("expira as entradas ao fim do TTL", () => {
    const cache = new TtlCache<number>(1000);
    cache.set("a", 1, 0);
    expect(cache.get("a", 500)).toBe(1);
    expect(cache.get("a", 1000)).toBeUndefined();
    expect(cache.size).toBe(0);
  });
  it("não cresce além do máximo", () => {
    const cache = new TtlCache<number>(60_000, 2);
    cache.set("a", 1, 0);
    cache.set("b", 2, 0);
    cache.set("c", 3, 0);
    expect(cache.size).toBe(2);
    expect(cache.get("a", 0)).toBeUndefined();
    expect(cache.get("c", 0)).toBe(3);
  });
});
