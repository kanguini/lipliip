import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/urls";
import { TEMPLATES } from "@/lib/templates";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  return [{ url: base, priority: 1 }, ...TEMPLATES.map((t) => ({ url: `${base}/preview/${t.id}`, priority: 0.6 }))];
}
