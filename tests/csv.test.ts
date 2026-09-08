import { describe, expect, it } from "vitest";
import { parseGuestImport } from "@/lib/csv";

describe("parseGuestImport", () => {
  it("lê linhas separadas por ; com cabeçalho", () => {
    const { rows, errors } = parseGuestImport("Nome;Telefone;Acompanhantes;Grupo\nAna Silva;912345678;2;Família\nRui;+244923456789");
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ name: "Ana Silva", phone: "912345678", maxCompanions: 2, groupName: "Família" });
    expect(rows[1]).toMatchObject({ name: "Rui", phone: "+244923456789", maxCompanions: 0 });
  });
  it("aceita vírgula e tab e reporta erros por linha", () => {
    const { rows, errors } = parseGuestImport("Ana,912345678\nSem telefone\n\nJoão\t913333333\tx");
    expect(rows.map((r) => r.name)).toEqual(["Ana"]);
    expect(errors).toEqual([
      { line: 2, message: "Telefone em falta" },
      { line: 4, message: "Número de acompanhantes inválido" },
    ]);
  });
});
