import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export const SUPPORTED_COUNTRIES: { code: CountryCode; label: string }[] = [
  { code: "PT", label: "Portugal (+351)" },
  { code: "AO", label: "Angola (+244)" },
  { code: "MZ", label: "Moçambique (+258)" },
  { code: "BR", label: "Brasil (+55)" },
  { code: "CV", label: "Cabo Verde (+238)" },
  { code: "ST", label: "São Tomé e Príncipe (+239)" },
  { code: "GW", label: "Guiné-Bissau (+245)" },
  { code: "ES", label: "Espanha (+34)" },
  { code: "FR", label: "França (+33)" },
  { code: "GB", label: "Reino Unido (+44)" },
  { code: "US", label: "EUA (+1)" },
];

/** Normaliza um telefone para E.164 (ex: "+351912345678"). Devolve null se inválido. */
export function normalizePhone(raw: string, defaultCountry: string = "PT"): string | null {
  const cleaned = raw.replace(/[\s().-]/g, "");
  if (!cleaned) return null;
  const parsed = parsePhoneNumberFromString(cleaned, defaultCountry as CountryCode);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number;
}

/** Oculta parte do número para mostrar ao convidado: "+351 ••• ••• 678". */
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
