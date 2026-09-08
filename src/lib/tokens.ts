import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

/** Token opaco e imprevisível usado no link pessoal de cada convidado. */
export function generateInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Token de sessão de utilizador (organizador). */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Identificador do dispositivo verificado do convidado (guardado em cookie). */
export function generateDeviceToken(): string {
  return randomBytes(24).toString("base64url");
}

const CHECKIN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I para evitar confusões

/** Código curto (ex: "K7PM2Q") para check-in manual à porta. */
export function generateCheckinCode(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) out += CHECKIN_ALPHABET[randomInt(CHECKIN_ALPHABET.length)];
  return out;
}

/** Código OTP numérico de 6 dígitos. */
export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(code: string, guestId: string): string {
  return createHash("sha256").update(`${guestId}:${code.trim()}`).digest("hex");
}

export function verifyOtpHash(code: string, guestId: string, hash: string): boolean {
  const a = Buffer.from(hashOtp(code, guestId));
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}
