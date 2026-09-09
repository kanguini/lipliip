import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

/**
 * Países disponíveis como "país por omissão" dos telefones de um evento.
 * Só afeta números escritos SEM indicativo: qualquer número com "+" é aceite venha de onde vier.
 * Angola primeiro (mercado principal), depois os países de língua portuguesa e vizinhos.
 */
export const SUPPORTED_COUNTRIES: { code: CountryCode; label: string }[] = [
  { code: "AO", label: "Angola (+244)" },
  { code: "PT", label: "Portugal (+351)" },
  { code: "MZ", label: "Moçambique (+258)" },
  { code: "BR", label: "Brasil (+55)" },
  { code: "CV", label: "Cabo Verde (+238)" },
  { code: "ST", label: "São Tomé e Príncipe (+239)" },
  { code: "GW", label: "Guiné-Bissau (+245)" },
  { code: "NA", label: "Namíbia (+264)" },
  { code: "ZA", label: "África do Sul (+27)" },
  { code: "CD", label: "RD Congo (+243)" },
  { code: "CG", label: "Congo (+242)" },
  { code: "ZM", label: "Zâmbia (+260)" },
  { code: "NG", label: "Nigéria (+234)" },
  { code: "ES", label: "Espanha (+34)" },
  { code: "FR", label: "França (+33)" },
  { code: "GB", label: "Reino Unido (+44)" },
  { code: "DE", label: "Alemanha (+49)" },
  { code: "US", label: "EUA (+1)" },
  { code: "CA", label: "Canadá (+1)" },
  { code: "AE", label: "Emirados Árabes Unidos (+971)" },
  { code: "CN", label: "China (+86)" },
];

export const DEFAULT_COUNTRY: CountryCode = "AO";

export function isSupportedCountry(code: string): code is CountryCode {
  return SUPPORTED_COUNTRIES.some((c) => c.code === code);
}

/** Normaliza um telefone para E.164 (ex: "+244923456789"). Devolve null se inválido. */
export function normalizePhone(raw: string, defaultCountry: string = DEFAULT_COUNTRY): string | null {
  const cleaned = raw.replace(/[\s().-]/g, "");
  if (!cleaned) return null;
  const parsed = parsePhoneNumberFromString(cleaned, defaultCountry as CountryCode);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number;
}

/** Oculta parte do número para mostrar ao convidado: "+244 ••• ••• 789". */
export function maskPhone(e164: string): string {
  const parsed = parsePhoneNumberFromString(e164);
  const cc = parsed ? `+${parsed.countryCallingCode}` : "";
  const national = parsed ? parsed.nationalNumber : e164.replace(/\D/g, "");
  const visible = national.slice(-3);
  const hidden = "•".repeat(Math.max(national.length - 3, 0)).replace(/(.{3})/g, "$1 ").trim();
  return `${cc} ${hidden} ${visible}`.replace(/\s+/g, " ").trim();
}

export function formatPhone(e164: string): string {
  const parsed = parsePhoneNumberFromString(e164);
  return parsed ? parsed.formatInternational() : e164;
}

/** Número apenas com dígitos, formato exigido por links wa.me. */
export function phoneForWhatsApp(e164: string): string {
  return e164.replace(/\D/g, "");
}
