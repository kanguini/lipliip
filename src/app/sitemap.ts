import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/urls";
import { TEMPLATES } from "@/lib/templates";
import { db } from "@/lib/db";

// Gerado a cada pedido para incluir os fornecedores publicados no diretório.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  let suppliers: { id: string; updatedAt: Date }[] = [];
  try {
    suppliers = await db.supplier.findMany({ where: { active: true }, select: { id: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 5000 });
  } catch {
    // Sem base de dados (ex.: durante a build) o sitemap fica só com as páginas estáticas.
  }
  return [
    { url: base, priority: 1 },
    { url: `${base}/fornecedores`, priority: 0.8, changeFrequency: "weekly" },
    ...TEMPLATES.map((t) => ({ url: `${base}/preview/${t.id}`, priority: 0.6 })),
    ...suppliers.map((s) => ({ url: `${base}/fornecedores/${s.id}`, priority: 0.5, lastModified: s.updatedAt })),
  ];
}
