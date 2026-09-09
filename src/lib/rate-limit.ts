/**
 * Limitador simples em memória (por processo). Suficiente para uma instância;
 * com várias réplicas deve ser substituído por Redis ou pela base de dados.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  b.count++;
  if (b.count > max) return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  return { ok: true, retryAfterSec: 0 };
}

/** Devolve a unidade consumida por `rateLimit` quando a operação não chegou a acontecer (ex.: envio falhou). */
export function rateLimitRefund(key: string) {
  const b = buckets.get(key);
  if (b && b.count > 0) b.count--;
}

// Limpeza periódica para não crescer indefinidamente.
if (typeof setInterval === "function") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }, 60_000);
  if (typeof timer === "object" && timer && "unref" in timer) (timer as { unref(): void }).unref();
}
