import { describe, expect, it } from "vitest";
import { calendarDaysUntil, eventEnd } from "@/lib/timezone";
import { buildIcs } from "@/lib/ics";
import { parseGuestImport } from "@/lib/csv";

describe("eventEnd", () => {
  const start = new Date("2027-06-14T14:00:00.000Z"); // 15:00 em Lisboa (verão)
  it("usa a hora de fim no mesmo dia", () => {
    expect(eventEnd(start, "20:00", "Europe/Lisbon").toISOString()).toBe("2027-06-14T19:00:00.000Z");
  });
  it("passa para o dia seguinte quando a hora de fim é antes do início", () => {
    expect(eventEnd(start, "02:00", "Europe/Lisbon").toISOString()).toBe("2027-06-15T01:00:00.000Z");
  });
  it("assume 5 horas sem hora de fim", () => {
    expect(eventEnd(start, null, "Europe/Lisbon").toISOString()).toBe("2027-06-14T19:00:00.000Z");
  });
});

describe("calendarDaysUntil", () => {
  it("conta dias de calendário no fuso do evento", () => {
    const now = new Date("2027-06-13T23:30:00.000Z"); // já é dia 14 em Lisboa (00:30)
    const event = new Date("2027-06-14T14:00:00.000Z");
    expect(calendarDaysUntil(event, "Europe/Lisbon", now)).toBe(0);
    expect(calendarDaysUntil(event, "America/Sao_Paulo", now)).toBe(1);
    expect(calendarDaysUntil(new Date("2027-06-20T14:00:00.000Z"), "Europe/Lisbon", now)).toBe(6);
  });
});

describe("ICS", () => {
  it("dobra linhas longas a 75 octetos", () => {
    const ics = buildIcs({ uid: "u", title: "x", description: "a".repeat(200), start: new Date(Date.UTC(2027, 0, 1)) });
    for (const line of ics.split("\r\n")) expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
    expect(ics.replace(/\r\n /g, "")).toContain("DESCRIPTION:" + "a".repeat(200));
  });
  it("usa a hora de fim indicada", () => {
    const ics = buildIcs({ uid: "u", title: "x", start: new Date(Date.UTC(2027, 0, 1, 20)), end: new Date(Date.UTC(2027, 0, 2, 2)) });
    expect(ics).toContain("DTEND:20270102T020000Z");
  });
});

describe("importação com vírgulas nos nomes", () => {
  it("prefere ; quando existe e mantém vírgulas no nome", () => {
    const { rows } = parseGuestImport("Silva, Ana; 912345678; 1");
    expect(rows[0]).toMatchObject({ name: "Silva, Ana", phone: "912345678", maxCompanions: 1 });
  });
});
