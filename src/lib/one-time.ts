import { randomBytes } from "node:crypto";

/**
 * Segredos mostrados uma única vez (PIN da receção, link de recuperação gerado pelo administrador).
 * A Server Action guarda o valor e redireciona com um identificador; a página troca-o pelo valor e ele
 * desaparece. Assim o segredo nunca fica no URL, no histórico do browser nem nos logs de acesso.
 * Em memória, por processo: com várias réplicas o segredo pode não estar na réplica que serve a página —
 * nesse caso a página diz para gerar de novo (comportamento seguro, nunca errado).
 */
const stash = new Map<string, { value: string; expiresAt: number }>();
const TTL_MS = 5 * 60_000;

export function stashSecret(value: string): string {
  // Limpeza oportunista para o mapa não crescer.
  const now = Date.now();
  for (const [k, v] of stash) if (v.expiresAt < now) stash.delete(k);
  const id = randomBytes(16).toString("base64url");
  stash.set(id, { value, expiresAt: now + TTL_MS });
  return id;
}

/** Devolve o segredo e apaga-o; null se já foi visto, expirou ou está noutra réplica. */
export function popSecret(id: string | undefined | null): string | null {
  if (!id) return null;
  const entry = stash.get(id);
  stash.delete(id);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.value;
}
