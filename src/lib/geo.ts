/**
 * Coordenadas do local do evento e pesquisa de moradas (OpenStreetMap Nominatim).
 * Funções puras, partilhadas pelo painel, pelo convite e pelo Route Handler /api/geocode.
 */

/** Centro por omissão do mapa quando o evento ainda não tem coordenadas: Luanda. */
export const DEFAULT_MAP_CENTER = { lat: -8.839, lng: 13.289 } as const;
export const DEFAULT_MAP_ZOOM = 12;
export const MARKER_ZOOM = 16;

export type LatLng = { lat: number; lng: number };

/** Lê uma coordenada escrita num formulário. Devolve null se estiver vazia ou fora do intervalo. */
export function parseCoordinate(raw: string | null | undefined, kind: "lat" | "lng"): number | null {
  if (raw == null) return null;
  const s = String(raw).trim().replace(",", ".");
  if (!s) return null;
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) return null;
  const limit = kind === "lat" ? 90 : 180;
  if (Math.abs(n) > limit) return null;
  return Math.round(n * 1e6) / 1e6;
}

/** Par de coordenadas válido ou null (ambas têm de existir; uma só é ignorada). */
export function parseLatLng(lat: string | null | undefined, lng: string | null | undefined): LatLng | null {
  const a = parseCoordinate(lat, "lat");
  const b = parseCoordinate(lng, "lng");
  if (a == null || b == null) return null;
  return { lat: a, lng: b };
}

export function hasCoordinates(e: { venueLat?: number | null; venueLng?: number | null }): e is { venueLat: number; venueLng: number } {
  return typeof e.venueLat === "number" && typeof e.venueLng === "number" && Number.isFinite(e.venueLat) && Number.isFinite(e.venueLng);
}

/** Link "Como chegar" no Google Maps (abre a app no telemóvel). */
export function directionsUrl({ lat, lng }: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

/** Resultado de pesquisa simplificado que enviamos ao browser. */
export type GeoResult = { label: string; lat: number; lng: number };

type NominatimRow = { display_name?: unknown; lat?: unknown; lon?: unknown };

/** Converte a resposta do Nominatim (format=jsonv2) na nossa lista de resultados, ignorando entradas malformadas. */
export function normalizeNominatimResults(raw: unknown, limit = 5): GeoResult[] {
  if (!Array.isArray(raw)) return [];
  const out: GeoResult[] = [];
  for (const row of raw as NominatimRow[]) {
    if (!row || typeof row !== "object") continue;
    const lat = parseCoordinate(typeof row.lat === "string" || typeof row.lat === "number" ? String(row.lat) : null, "lat");
    const lng = parseCoordinate(typeof row.lon === "string" || typeof row.lon === "number" ? String(row.lon) : null, "lng");
    const label = typeof row.display_name === "string" ? row.display_name.trim().slice(0, 200) : "";
    if (lat == null || lng == null || !label) continue;
    out.push({ label, lat, lng });
    if (out.length >= limit) break;
  }
  return out;
}

/** Limpa a pesquisa do utilizador: espaços, tamanho máximo, e chave estável para a cache. */
export function normalizeGeoQuery(q: string | null | undefined): string {
  return String(q ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
}

export function geoCacheKey(q: string): string {
  return normalizeGeoQuery(q).toLocaleLowerCase("pt-PT");
}

/** Cache em memória com validade (por processo). */
export class TtlCache<V> {
  private store = new Map<string, { value: V; expiresAt: number }>();
  constructor(private ttlMs: number, private maxEntries = 500) {}

  get(key: string, now = Date.now()): V | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= now) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: V, now = Date.now()) {
    if (this.store.size >= this.maxEntries) {
      // Remove as entradas expiradas; se não chegar, a mais antiga.
      for (const [k, v] of this.store) if (v.expiresAt <= now) this.store.delete(k);
      if (this.store.size >= this.maxEntries) {
        const oldest = this.store.keys().next().value;
        if (oldest !== undefined) this.store.delete(oldest);
      }
    }
    this.store.set(key, { value, expiresAt: now + this.ttlMs });
  }

  get size() {
    return this.store.size;
  }
}
