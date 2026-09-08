import { describe, expect, it } from "vitest";
import { parseGalleryText, parsePartyText, parseStoryText, partyToText, storyToText } from "@/lib/event-types";
import { buildEpcPayload } from "@/lib/epc";
import { googleCalendarUrl } from "@/lib/urls";

describe("conteúdo extra", () => {
  it("lê a galeria ignorando linhas que não são URLs", () => {
    expect(parseGalleryText("https://a.com/1.jpg\nnão é url\n\nhttp://b.com/2.png")).toEqual(["https://a.com/1.jpg", "http://b.com/2.png"]);
  });
  it("lê a história com campos opcionais e volta a texto", () => {
    const items = parseStoryText("2019 - Conhecemo-nos - Numa festa em Lisboa - https://x.com/f.jpg\n2024 - O pedido\nSó título");
    expect(items).toEqual([
      { date: "2019", title: "Conhecemo-nos", text: "Numa festa em Lisboa", imageUrl: "https://x.com/f.jpg" },
      { date: "2024", title: "O pedido", text: undefined, imageUrl: undefined },
      { title: "Só título", imageUrl: undefined },
    ]);
    expect(storyToText(items)).toBe("2019 - Conhecemo-nos - Numa festa em Lisboa - https://x.com/f.jpg\n2024 - O pedido\nSó título");
  });
  it("lê padrinhos", () => {
    const p = parsePartyText("Rita - Madrinha - https://x.com/r.jpg\nTiago - Padrinho\nInês");
    expect(p).toEqual([
      { name: "Rita", role: "Madrinha", imageUrl: "https://x.com/r.jpg" },
      { name: "Tiago", role: "Padrinho", imageUrl: undefined },
      { name: "Inês", role: undefined, imageUrl: undefined },
    ]);
    expect(partyToText(p)).toBe("Rita - Madrinha - https://x.com/r.jpg\nTiago - Padrinho\nInês");
  });
});

describe("EPC QR", () => {
  it("gera o payload SEPA para um IBAN válido", () => {
    const payload = buildEpcPayload({ iban: "PT50 0002 0123 1234 5678 9015 4", name: "Ana & João", remittance: "Presente casamento" });
    expect(payload?.split("\n")).toEqual(["BCD", "002", "1", "SCT", "", "Ana & João", "PT50000201231234567890154", "", "", "", "Presente casamento"]);
  });
  it("rejeita IBAN inválido", () => {
    expect(buildEpcPayload({ iban: "123", name: "x" })).toBeNull();
  });
});

describe("googleCalendarUrl", () => {
  it("formata datas em UTC", () => {
    const url = googleCalendarUrl({ title: "Festa", start: new Date(Date.UTC(2027, 5, 14, 15, 0)), durationHours: 2, location: "Sintra" });
    expect(url).toContain("dates=20270614T150000Z%2F20270614T170000Z");
    expect(url).toContain("location=Sintra");
  });
});
