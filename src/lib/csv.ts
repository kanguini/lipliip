export type ImportedGuestRow = {
  line: number;
  name: string;
  phone: string;
  maxCompanions: number;
  groupName?: string;
  email?: string;
};

export type ImportResult = { rows: ImportedGuestRow[]; errors: { line: number; message: string }[] };

/**
 * Lê uma lista de convidados colada pelo organizador.
 * Cada linha: Nome ; Telefone ; Acompanhantes (opcional) ; Grupo (opcional) ; Email (opcional)
 * Aceita ";", "," ou tab como separador. Ignora uma primeira linha de cabeçalho.
 */
export function parseGuestImport(text: string): ImportResult {
  const rows: ImportedGuestRow[] = [];
  const errors: { line: number; message: string }[] = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((rawLine, idx) => {
    const line = idx + 1;
    const trimmed = rawLine.trim();
    if (!trimmed) return;
    const parts = trimmed.split(/\t|;|,/).map((p) => p.trim().replace(/^"|"$/g, ""));
    const [name, phone, comp, groupName, email] = parts;
    if (idx === 0 && /^nome$/i.test(name ?? "")) return; // cabeçalho
    if (!name) return errors.push({ line, message: "Nome em falta" });
    if (!phone) return errors.push({ line, message: "Telefone em falta" });
    const maxCompanions = comp ? Number.parseInt(comp, 10) : 0;
    if (Number.isNaN(maxCompanions) || maxCompanions < 0) {
      return errors.push({ line, message: "Número de acompanhantes inválido" });
    }
    rows.push({ line, name, phone, maxCompanions, groupName: groupName || undefined, email: email || undefined });
  });

  return { rows, errors };
}
