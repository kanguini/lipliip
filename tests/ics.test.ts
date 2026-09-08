import { describe, expect, it } from "vitest";
import { buildIcs } from "@/lib/ics";

describe("buildIcs", () => {
  it("gera um evento iCalendar válido com escapes", () => {
    const ics = buildIcs({
      uid: "abc@lipliip",
      title: "Casamento Ana & João",
      location: "Quinta da Serra, Sintra",
      start: new Date(Date.UTC(2027, 5, 14, 15, 0)),
      durationHours: 6,
    });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART:20270614T150000Z");
    expect(ics).toContain("DTEND:20270614T210000Z");
    expect(ics).toContain("LOCATION:Quinta da Serra\\, Sintra");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});
