import { describe, expect, it } from "vitest";
import { menuToText, parseMenu, parseMenuText } from "@/lib/menu";

describe("ementa em texto", () => {
  it("lê secções e pratos com descrição e etiquetas", () => {
    const menu = parseMenuText("# Entradas\nSalada de polvo - com batata-doce - vegetariano, sem glúten\nPastéis de bacalhau\n\n# Pratos\nMuamba de galinha - com funje");
    expect(menu).toEqual([
      {
        title: "Entradas",
        items: [
          { name: "Salada de polvo", description: "com batata-doce", tags: ["vegetariano", "sem glúten"] },
          { name: "Pastéis de bacalhau", description: undefined, tags: undefined },
        ],
      },
      { title: "Pratos", items: [{ name: "Muamba de galinha", description: "com funje", tags: undefined }] },
    ]);
  });
  it("cria uma secção por omissão quando o texto começa por um prato", () => {
    expect(parseMenuText("Cabrito assado")).toEqual([{ title: "Ementa", items: [{ name: "Cabrito assado", description: undefined, tags: undefined }] }]);
  });
  it("ignora secções sem pratos e texto vazio", () => {
    expect(parseMenuText("# Só título\n\n# Outro")).toEqual([]);
    expect(parseMenuText("")).toEqual([]);
    expect(parseMenuText("   \n  ")).toEqual([]);
  });
  it("faz a viagem de ida e volta texto → JSON → texto", () => {
    const text = "# Entradas\nSalada de polvo - com batata-doce - vegetariano, sem glúten\nPastéis de bacalhau\n\n# Sobremesas\nCocada amarela - doce tradicional";
    const sections = parseMenuText(text);
    expect(menuToText(sections)).toBe(text);
    // O que se guarda na base de dados volta a ler-se igual.
    expect(parseMenu(JSON.stringify(sections))).toEqual(sections.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i })) })));
    expect(menuToText(parseMenu(JSON.stringify(sections)))).toBe(text);
  });
  it("tolera JSON inválido ou nulo", () => {
    expect(parseMenu(null)).toEqual([]);
    expect(parseMenu("{nope")).toEqual([]);
    expect(parseMenu('{"a":1}')).toEqual([]);
  });
});
