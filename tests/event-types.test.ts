import { describe, expect, it } from "vitest";
import { parseProgramText, programToText } from "@/lib/event-types";

describe("programa do evento", () => {
  it("converte texto em itens e de volta", () => {
    const items = parseProgramText("15:00 - Cerimónia - Igreja Matriz\n17:00 - Copo de água\nBrinde");
    expect(items).toEqual([
      { time: "15:00", title: "Cerimónia", description: "Igreja Matriz" },
      { time: "17:00", title: "Copo de água", description: undefined },
      { time: "", title: "Brinde" },
    ]);
    expect(programToText(items)).toBe("15:00 - Cerimónia - Igreja Matriz\n17:00 - Copo de água\nBrinde");
  });
});
