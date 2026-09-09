import { randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "./db";
import { sha256, serverSecret } from "./tokens";
import { formatTime } from "./format";

/**
 * Check-in no dia do evento: lógica partilhada pelo painel (equipa com conta) e pela página de receção
 * sem conta (link + PIN).
 */

/** Normaliza um código de entrada escrito ou lido do QR: maiúsculas, só letras e dígitos, no máximo 12. */
export function normalizeCheckinCode(raw: string | null | undefined): string {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
}

export type CheckinGuest = {
  id: string;
  name: string;
  rsvpStatus: string;
  companions: number;
  tableNumber: string | null;
  suspendedAt: Date | null;
  checkedInAt: Date | null;
};

/** Texto que acompanha a entrada registada: acompanhantes, mesa ou aviso de que não tinha confirmado. */
export function checkinExtra(guest: Pick<CheckinGuest, "rsvpStatus" | "companions" | "tableNumber">): string {
  if (guest.rsvpStatus !== "ACCEPTED") return " (não tinha confirmado presença)";
  return `${guest.companions ? ` +${guest.companions} acompanhante(s)` : ""}${guest.tableNumber ? ` · mesa ${guest.tableNumber}` : ""}`;
}

export type CheckinResult = { ok: boolean; message: string; guestId?: string };

/**
 * Regista a entrada de um convidado pelo código. Convites suspensos não entram; se dois dispositivos lerem
 * o mesmo QR ao mesmo tempo, só um regista a entrada (atualização condicional) e o outro recebe um aviso.
 */
export async function performCheckin(eventId: string, rawCode: string, timezone: string): Promise<CheckinResult> {
  const code = normalizeCheckinCode(rawCode);
  if (!code) return { ok: false, message: "Escreva ou leia o código do convite." };
  const guest = await db.guest.findFirst({
    where: { eventId, checkinCode: code },
    select: { id: true, name: true, rsvpStatus: true, companions: true, tableNumber: true, suspendedAt: true, checkedInAt: true },
  });
  if (!guest) return { ok: false, message: `Código ${code} não encontrado.` };
  if (guest.suspendedAt) return { ok: false, guestId: guest.id, message: `O convite de ${guest.name} está suspenso. Confirme com os anfitriões antes de deixar entrar.` };
  const { count } = await db.guest.updateMany({ where: { id: guest.id, checkedInAt: null }, data: { checkedInAt: new Date() } });
  if (count === 0) {
    const when = guest.checkedInAt ?? new Date();
    return { ok: false, guestId: guest.id, message: `Atenção: ${guest.name} já fez check-in às ${formatTime(when, timezone)}. Possível entrada duplicada.` };
  }
  await db.accessLog.create({ data: { guestId: guest.id, outcome: "CHECKIN" } });
  return { ok: true, guestId: guest.id, message: `Entrada registada: ${guest.name}${checkinExtra(guest)}` };
}

// ---------- Acesso da receção sem conta (link + PIN) ----------

export const RECEPTION_COOKIE_DAYS = 3;

/** Token de 32 caracteres base64url que identifica o link de receção. */
export function generateReceptionToken(): string {
  return randomBytes(24).toString("base64url");
}

/** PIN de 4 dígitos mostrado uma única vez ao organizador. */
export function generateReceptionPin(): string {
  return randomInt(0, 10_000).toString().padStart(4, "0");
}

export function hashReceptionPin(pin: string): string {
  return sha256(`reception-pin:${pin.trim()}`);
}

export function verifyReceptionPin(pin: string, pinHash: string): boolean {
  const a = Buffer.from(hashReceptionPin(pin));
  const b = Buffer.from(pinHash);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function receptionCookieName(eventId: string): string {
  return `lp_r_${eventId}`;
}

/**
 * Valor do cookie de sessão da receção: derivado do hash do PIN e do token. Revogar ou gerar um novo link
 * muda ambos, pelo que os cookies antigos deixam de ser válidos de imediato. Não depende do PIN em claro.
 */
export function receptionCookieValue(pinHash: string, token: string): string {
  // Inclui o segredo do servidor: sem ele, o cookie podia ser calculado offline a partir do link e dos 10 000 PINs possíveis.
  return sha256(`reception-session:${serverSecret()}:${pinHash}:${token}`);
}

export function isReceptionCookieValid(cookie: string | undefined, pinHash: string | null, token: string | null): boolean {
  if (!cookie || !pinHash || !token) return false;
  const a = Buffer.from(cookie);
  const b = Buffer.from(receptionCookieValue(pinHash, token));
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Pesquisa simples da lista de convidados por nome ou código. */
export function matchesGuestQuery(guest: { name: string; checkinCode: string }, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return guest.name.toLowerCase().includes(q) || guest.checkinCode.toLowerCase().includes(q.replace(/\s+/g, ""));
}
