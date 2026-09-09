import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { clientIpFromHeaders } from "@/lib/guest-access";
import { rateLimit } from "@/lib/rate-limit";
import { TtlCache, geoCacheKey, normalizeGeoQuery, normalizeNominatimResults, type GeoResult } from "@/lib/geo";

export const dynamic = "force-dynamic";

/**
 * Proxy para o OpenStreetMap Nominatim: o browser só pode falar com o nosso domínio (CSP connect-src 'self'),
 * e a política de utilização do Nominatim exige um User-Agent identificável e no máximo 1 pedido/segundo.
 */
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "Liplip/1.0 (https://www.liplip.online)";
const cache = new TtlCache<GeoResult[]>(10 * 60_000);

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra } });
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Sessão necessária." }, 401);

  const q = normalizeGeoQuery(new URL(req.url).searchParams.get("q"));
  if (q.length < 3) return json({ results: [] });

  const key = geoCacheKey(q);
  const cached = cache.get(key);
  if (cached) return json({ results: cached });

  const ip = clientIpFromHeaders(await headers()) ?? "local";
  const limit = rateLimit(`geocode:${ip}`, 1, 1000);
  if (!limit.ok) return json({ error: "Aguarde um segundo antes de pesquisar de novo." }, 429, { "Retry-After": String(Math.max(1, limit.retryAfterSec)) });

  const url = `${NOMINATIM}?format=jsonv2&limit=5&addressdetails=0&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json", "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.5" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return json({ error: "O serviço de mapas não respondeu. Tente de novo dentro de momentos." }, 502);
    const results = normalizeNominatimResults(await res.json());
    cache.set(key, results);
    return json({ results });
  } catch (e) {
    console.error("Falha na pesquisa de locais (Nominatim):", (e as Error).message);
    return json({ error: "Não foi possível pesquisar o local. Tente de novo." }, 502);
  }
}
