import { describe, it, expect } from "vitest";
import type { CustomTemplate } from "@prisma/client";
import { customTemplateMeta } from "@/lib/custom-templates";
import { mergeTemplateSettings } from "@/lib/templates-settings";
import { TEMPLATES } from "@/lib/templates";

function row(overrides: Partial<CustomTemplate> = {}): CustomTemplate {
  return {
    id: "clcustom1",
    name: "Bordeaux Floral",
    description: "",
    tag: "Romântico · Floral",
    types: ["WEDDING", "ENGAGEMENT"],
    imageMediaId: "media123",
    accentColor: "#541b38",
    bgColor: "#fbf5f7",
    textColor: "#30262e",
    sampleNames: "Ana & João",
    sampleCaption: "Com todo o amor.",
    enabled: true,
    premium: false,
    sortOrder: 0,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("customTemplateMeta", () => {
  it("mapeia uma linha para meta de cartaz (colecção 2026, imagem do Media)", () => {
    const meta = customTemplateMeta(row());
    expect(meta.id).toBe("clcustom1");
    expect(meta.collection).toBe("2026");
    expect(meta.custom).toBe(true);
    expect(meta.image).toBe("/media/media123");
    expect(meta.colors.accent).toBe("#541b38");
    expect(meta.types).toEqual(["WEDDING", "ENGAGEMENT"]);
    expect(meta.sample).toEqual({ names: "Ana & João", caption: "Com todo o amor." });
  });

  it("transporta o estado enabled/premium/sortOrder", () => {
    const meta = customTemplateMeta(row({ enabled: false, premium: true, sortOrder: 5 }));
    expect(meta.enabled).toBe(false);
    expect(meta.premium).toBe(true);
    expect(meta.sortOrder).toBe(5);
  });
});

describe("mergeTemplateSettings", () => {
  it("não inclui personalizados (só cruza o catálogo fixo com as definições)", () => {
    const merged = mergeTemplateSettings(TEMPLATES, []);
    expect(merged.every((t) => !t.custom)).toBe(true);
    expect(merged).toHaveLength(TEMPLATES.length);
  });
});
