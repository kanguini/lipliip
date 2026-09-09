import { describe, expect, it } from "vitest";
import { buildChecklist, CHECKLISTS } from "@/lib/checklists";

describe("buildChecklist", () => {
  it("calcula prazos a partir da data do evento", () => {
    const eventDate = new Date("2027-06-14T14:00:00Z");
    const now = new Date("2026-06-01T00:00:00Z");
    const tasks = buildChecklist("WEDDING", eventDate, now);
    expect(tasks).toHaveLength(CHECKLISTS.WEDDING.length);
    const first = tasks[0];
    expect(first.dueAt.toISOString().slice(0, 10)).toBe("2026-06-14"); // 365 dias antes
    expect(tasks.every((t, i) => t.sortOrder === i)).toBe(true);
  });
  it("tarefas já atrasadas ficam com prazo de hoje; pós-evento mantém-se depois da data", () => {
    const eventDate = new Date("2026-10-01T14:00:00Z");
    const now = new Date("2026-09-01T00:00:00Z");
    const tasks = buildChecklist("WEDDING", eventDate, now);
    const orc = tasks.find((t) => t.title.startsWith("Definir orçamento"))!;
    expect(orc.dueAt).toEqual(now);
    const thanks = tasks.find((t) => t.title.startsWith("Enviar agradecimentos"))!;
    expect(thanks.dueAt > eventDate).toBe(true);
  });
  it("usa a lista genérica para tipos desconhecidos", () => {
    expect(buildChecklist("XYZ", new Date()).length).toBe(CHECKLISTS.OTHER.length);
  });
});
