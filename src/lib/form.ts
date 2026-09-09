import { redirect } from "next/navigation";

/** Helpers partilhados pelas server actions do painel. */
export function flash(path: string, kind: "ok" | "error", message: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${kind}=${encodeURIComponent(message)}`);
}

/** Texto normalizado (CRLF → LF, aparado e limitado). */
export function str(fd: FormData, key: string, max = 500): string {
  return String(fd.get(key) ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max);
}
export function opt(fd: FormData, key: string, max = 500): string | null {
  return str(fd, key, max) || null;
}
export function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

/**
 * Lê um valor monetário escrito por pessoas: "1.250,00", "1,000.50", "2 500", "89,90", "1000".
 * Devolve null se for ambíguo ou inválido. Arredonda a cêntimos.
 */
export function parseMoney(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  let s = String(raw).replace(/[\s€$£]/g, "").replace(/[A-Za-z]/g, "");
  if (!s) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    // O último separador é o decimal; o outro é de milhares.
    const dec = Math.max(lastComma, lastDot);
    const decChar = s[dec];
    const thousands = decChar === "," ? "." : ",";
    s = s.split(thousands).join("");
    s = s.replace(decChar, ".");
  } else if (lastComma >= 0) {
    const parts = s.split(",");
    // "1,000" com exatamente 3 dígitos depois de uma única vírgula é ambíguo → tratamos como milhares (inglês) só se houver mais de um grupo
    s = parts.length > 2 || (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3 && parts[0] !== "0" && false) ? parts.join("") : parts.join(".");
  } else if (lastDot >= 0) {
    const parts = s.split(".");
    // "2.500" (pt) → milhares; "2.5" → decimal
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) s = parts.join("");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Math.round(Number.parseFloat(s) * 100) / 100;
  return Number.isFinite(n) && n >= 0 ? n : null;
}
