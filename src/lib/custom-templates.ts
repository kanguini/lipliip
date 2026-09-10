import { cache } from "react";
import type { CustomTemplate } from "@prisma/client";
import { db } from "./db";
import { mediaUrl } from "./media";
import type { TemplateMeta } from "./templates";
import type { ListedTemplate } from "./templates-settings";

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "'Inter', system-ui, sans-serif";

/** Tipos de evento válidos para um template personalizado. */
export const CUSTOM_TEMPLATE_TYPES = ["WEDDING", "ENGAGEMENT", "BIRTHDAY", "OTHER"] as const;

/**
 * Converte uma linha de CustomTemplate no formato usado para desenhar o convite.
 * Os personalizados comportam-se como cartazes (colecção 2026): a imagem é o fundo e o texto vai por cima.
 */
export function customTemplateMeta(row: CustomTemplate): ListedTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    tag: row.tag,
    collection: "2026",
    types: row.types,
    colors: { bg: row.bgColor, accent: row.accentColor, text: row.textColor },
    fontHeading: SERIF,
    fontBody: SANS,
    sample: { names: row.sampleNames, caption: row.sampleCaption },
    image: mediaUrl(row.imageMediaId),
    custom: true,
    enabled: row.enabled,
    premium: row.premium,
    sortOrder: row.sortOrder,
  };
}

/** Todos os templates personalizados (incluindo desativados), como metadados de desenho. Uma leitura por pedido. */
export const getCustomTemplates = cache(async (): Promise<ListedTemplate[]> => {
  const rows = await db.customTemplate.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return rows.map(customTemplateMeta);
});

/** Meta de um template personalizado por id (null se não existir). */
export async function getCustomTemplate(id: string): Promise<TemplateMeta | null> {
  return (await getCustomTemplates()).find((t) => t.id === id) ?? null;
}
