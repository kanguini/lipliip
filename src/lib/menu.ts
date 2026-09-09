/** Ementa mostrada aos convidados: secções (Entradas, Pratos, Sobremesas, Bebidas…) com itens. */
export type MenuItem = { name: string; description?: string; tags?: string[] };
export type MenuSection = { title: string; items: MenuItem[] };

export function parseMenu(json: string | null | undefined): MenuSection[] {
  if (!json) return [];
  try {
    const raw = JSON.parse(json);
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((s) => s && typeof s.title === "string")
      .map((s) => ({
        title: String(s.title).slice(0, 80),
        items: Array.isArray(s.items)
          ? s.items
              .filter((i: unknown) => i && typeof (i as MenuItem).name === "string")
              .map((i: MenuItem) => ({ name: String(i.name).slice(0, 120), description: i.description ? String(i.description).slice(0, 300) : undefined, tags: Array.isArray(i.tags) ? i.tags.map(String).slice(0, 6) : undefined }))
          : [],
      }));
  } catch {
    return [];
  }
}

/**
 * Formato de texto simples para o formulário do painel:
 *   # Entradas
 *   Salada de polvo - com batata doce - vegetariano, sem glúten
 *   # Pratos principais
 *   Cabrito assado
 * Cada linha "# Título" abre uma secção; cada linha seguinte é "nome - descrição - etiquetas separadas por vírgula".
 */
export function parseMenuText(text: string): MenuSection[] {
  const sections: MenuSection[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      sections.push({ title: line.replace(/^#+\s*/, "").slice(0, 80) || "Ementa", items: [] });
      continue;
    }
    if (sections.length === 0) sections.push({ title: "Ementa", items: [] });
    const [name, description, tags] = line.split(/\s+-\s+/);
    sections[sections.length - 1].items.push({
      name: name.slice(0, 120),
      description: description?.trim() ? description.trim().slice(0, 300) : undefined,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 6) : undefined,
    });
  }
  return sections.filter((s) => s.items.length > 0);
}

export function menuToText(sections: MenuSection[]): string {
  return sections
    .map((s) => [`# ${s.title}`, ...s.items.map((i) => [i.name, i.description, i.tags?.join(", ")].filter(Boolean).join(" - "))].join("\n"))
    .join("\n\n");
}
