import { cache } from "react";
import { db } from "./db";
import { TEMPLATES, type TemplateMeta } from "./templates";

/** Estado administrável de um template (linha TemplateSetting); por omissão todos estão ativos e não são premium. */
export type TemplateState = { id: string; enabled: boolean; premium: boolean; sortOrder: number };

export type ListedTemplate = TemplateMeta & { enabled: boolean; premium: boolean; sortOrder: number };

/** Junta o catálogo fixo (TEMPLATES) com as linhas guardadas e ordena por sortOrder (empate: ordem do catálogo). Função pura. */
export function mergeTemplateSettings(templates: TemplateMeta[], rows: TemplateState[]): ListedTemplate[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  return templates
    .map((t, index) => {
      const row = byId.get(t.id);
      return { ...t, enabled: row?.enabled ?? true, premium: row?.premium ?? false, sortOrder: row?.sortOrder ?? 0, _index: index };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a._index - b._index)
    .map(({ _index: _i, ...t }) => t);
}

/** Todos os templates com o estado guardado (incluindo os desativados), uma leitura por pedido. */
export const getAllTemplates = cache(async (): Promise<ListedTemplate[]> => {
  const rows = await db.templateSetting.findMany({ select: { id: true, enabled: true, premium: true, sortOrder: true } });
  return mergeTemplateSettings(TEMPLATES, rows);
});

/** Templates disponíveis ao público (ativos). Passe o tipo de evento para filtrar. */
export async function getAvailableTemplates(type?: string): Promise<ListedTemplate[]> {
  const all = await getAllTemplates();
  return all.filter((t) => t.enabled && (!type || t.types.includes(type)));
}

export async function getTemplateState(id: string): Promise<ListedTemplate | null> {
  return (await getAllTemplates()).find((t) => t.id === id) ?? null;
}
