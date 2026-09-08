/**
 * Datas dos eventos: o organizador escreve a hora local do evento; guardamos em UTC e
 * formatamos sempre no fuso horário do evento, independentemente do servidor ou do telemóvel.
 */
export const TIMEZONES: { id: string; label: string }[] = [
  { id: "Europe/Lisbon", label: "Lisboa (Portugal continental)" },
  { id: "Atlantic/Azores", label: "Açores" },
  { id: "Africa/Luanda", label: "Luanda (Angola)" },
  { id: "Africa/Maputo", label: "Maputo (Moçambique)" },
  { id: "Atlantic/Cape_Verde", label: "Cabo Verde" },
  { id: "Africa/Sao_Tome", label: "São Tomé e Príncipe" },
  { id: "Africa/Bissau", label: "Guiné-Bissau" },
  { id: "America/Sao_Paulo", label: "São Paulo / Brasília" },
  { id: "Europe/Madrid", label: "Madrid" },
  { id: "Europe/Paris", label: "Paris" },
  { id: "Europe/London", label: "Londres" },
  { id: "America/New_York", label: "Nova Iorque" },
];

export const COUNTRY_TIMEZONE: Record<string, string> = {
  PT: "Europe/Lisbon",
  AO: "Africa/Luanda",
  MZ: "Africa/Maputo",
  BR: "America/Sao_Paulo",
  CV: "Atlantic/Cape_Verde",
  ST: "Africa/Sao_Tome",
  GW: "Africa/Bissau",
  ES: "Europe/Madrid",
  FR: "Europe/Paris",
  GB: "Europe/London",
  US: "America/New_York",
};

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Partes locais de um instante num fuso horário. */
function partsIn(date: Date, tz: string) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p: Record<string, number> = {};
  for (const { type, value } of f.formatToParts(date)) if (type !== "literal") p[type] = Number(value);
  return p;
}

/** Desvio (ms) entre a hora local do fuso e UTC para um dado instante. */
function offsetMs(date: Date, tz: string): number {
  const p = partsIn(date, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - date.getTime();
}

/** Converte "2027-06-14T15:00" (hora local do evento) para o instante UTC correto. */
export function localInputToDate(input: string, tz: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(input.trim());
  if (!m) return null;
  const [, y, mo, d, h = "0", mi = "0"] = m;
  const guess = Date.UTC(+y, +mo - 1, +d, +h, +mi);
  // Duas iterações chegam ao valor certo mesmo junto às mudanças de hora.
  let utc = guess - offsetMs(new Date(guess), tz);
  utc = guess - offsetMs(new Date(utc), tz);
  const date = new Date(utc);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Valor para <input type="datetime-local"> na hora local do evento. */
export function dateToLocalInput(date: Date, tz: string): string {
  const p = partsIn(date, tz);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

export function dateToLocalDateInput(date: Date, tz: string): string {
  return dateToLocalInput(date, tz).slice(0, 10);
}
