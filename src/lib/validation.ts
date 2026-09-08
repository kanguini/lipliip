/** Aceita apenas URLs http(s) absolutos; devolve null para qualquer outra coisa (evita javascript:, data:, etc.). */
export function httpUrlOrNull(value: string | null | undefined, max = 500): string | null {
  const v = (value ?? "").trim().slice(0, max);
  if (!v) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Protege células CSV contra injeção de fórmulas no Excel (=, +, -, @). */
export function csvSafe(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}
