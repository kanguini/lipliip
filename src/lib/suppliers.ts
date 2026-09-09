/**
 * Diretório público de fornecedores: categorias, províncias de Angola e helpers puros
 * (sem acesso à base de dados) partilhados pelas páginas públicas e pela administração.
 */

export const SUPPLIER_CATEGORIES = [
  { id: "VENUE", label: "Salões e espaços" },
  { id: "CATERING", label: "Buffet e catering" },
  { id: "DECOR", label: "Decoração e flores" },
  { id: "MUSIC", label: "Música e DJ" },
  { id: "PHOTO", label: "Fotografia e vídeo" },
  { id: "SOUND", label: "Som e iluminação" },
  { id: "CAKES", label: "Bolos e doces" },
  { id: "PRINT", label: "Convites impressos e gráfica" },
  { id: "TRANSPORT", label: "Transporte" },
  { id: "FASHION", label: "Vestuário e alfaiataria" },
  { id: "BEAUTY", label: "Beleza e cabeleireiro" },
  { id: "ENTERTAINMENT", label: "Animação" },
  { id: "OTHER", label: "Outros" },
] as const;

export type SupplierCategory = (typeof SUPPLIER_CATEGORIES)[number]["id"];

/** As 18 províncias de Angola, por ordem alfabética. */
export const ANGOLA_PROVINCES = [
  "Bengo",
  "Benguela",
  "Bié",
  "Cabinda",
  "Cuando Cubango",
  "Cuanza Norte",
  "Cuanza Sul",
  "Cunene",
  "Huambo",
  "Huíla",
  "Luanda",
  "Lunda Norte",
  "Lunda Sul",
  "Malanje",
  "Moxico",
  "Namibe",
  "Uíge",
  "Zaire",
] as const;

export type AngolaProvince = (typeof ANGOLA_PROVINCES)[number];

export function isSupplierCategory(value: string | null | undefined): value is SupplierCategory {
  return SUPPLIER_CATEGORIES.some((c) => c.id === value);
}

export function isAngolaProvince(value: string | null | undefined): value is AngolaProvince {
  return ANGOLA_PROVINCES.some((p) => p === value);
}

/** Nome legível de uma categoria; categorias desconhecidas (dados antigos) mostram-se tal como estão. */
export function supplierCategoryLabel(id: string | null | undefined): string {
  return SUPPLIER_CATEGORIES.find((c) => c.id === id)?.label ?? (id || "Outros");
}

/** Filtros aceites nas páginas do diretório (URL → valores seguros). */
export type SupplierFilters = { category: SupplierCategory | null; province: AngolaProvince | null; q: string };

export function parseSupplierFilters(input: { category?: string; province?: string; q?: string } | null | undefined): SupplierFilters {
  const category = isSupplierCategory(input?.category) ? input!.category : null;
  const province = isAngolaProvince(input?.province) ? input!.province : null;
  const q = String(input?.q ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  return { category, province, q };
}

/** Query string para uma combinação de filtros (mantém só os que estão definidos). */
export function supplierFiltersQuery(filters: Partial<SupplierFilters>): string {
  const p = new URLSearchParams();
  if (filters.category) p.set("category", filters.category);
  if (filters.province) p.set("province", filters.province);
  if (filters.q) p.set("q", filters.q);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Localidade legível: "Talatona, Luanda", "Luanda" ou "" quando não há nada. */
export function supplierLocation(s: { city?: string | null; province?: string | null }): string {
  const city = s.city?.trim();
  const province = s.province?.trim();
  if (city && province && city.toLowerCase() !== province.toLowerCase()) return `${city}, ${province}`;
  return city || province || "";
}

/**
 * Link "Ver no mapa" (pesquisa no Google Maps). Sem iframes: abre numa nova janela.
 * Coordenadas têm prioridade; caso contrário pesquisa pela morada + localidade + Angola.
 */
export function supplierMapsUrl(s: { address?: string | null; city?: string | null; province?: string | null; lat?: number | null; lng?: number | null }): string | null {
  if (typeof s.lat === "number" && typeof s.lng === "number" && Number.isFinite(s.lat) && Number.isFinite(s.lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.lat},${s.lng}`)}`;
  }
  const parts = [s.address?.trim(), supplierLocation(s)].filter(Boolean);
  if (parts.length === 0) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${parts.join(", ")}, Angola`)}`;
}

/** Link wa.me a partir de um número escrito de qualquer forma ("+244 923 000 000", "923000000"). Angola por omissão. */
export function supplierWhatsappUrl(raw: string | null | undefined, text?: string): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Número nacional angolano (9 dígitos a começar por 9) sem indicativo → +244.
  if (digits.length === 9 && digits.startsWith("9")) digits = `244${digits}`;
  if (digits.length < 8 || digits.length > 15) return null;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${q}`;
}

/** Número em formato tel: (mantém o + e os dígitos). */
export function supplierTelUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d+]/g, "");
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 6) return null;
  return `tel:${cleaned.startsWith("+") ? "+" : ""}${digits}`;
}

/** Coordenada válida ("−8.83" → -8.83) ou null quando vazia/inválida. */
export function parseCoordinate(raw: string | null | undefined, kind: "lat" | "lng"): number | null | undefined {
  const s = String(raw ?? "").trim().replace(",", ".");
  if (!s) return null;
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) return undefined;
  const limit = kind === "lat" ? 90 : 180;
  if (Math.abs(n) > limit) return undefined;
  return Math.round(n * 1e6) / 1e6;
}

/** Descrição curta para os cartões (primeira frase ou 140 caracteres). */
export function supplierExcerpt(text: string | null | undefined, max = 140): string {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\-–]+$/, "")}…`;
}
