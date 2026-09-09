/**
 * Datas dos eventos: o organizador escreve a hora local do evento; guardamos em UTC e
 * formatamos sempre no fuso horário do evento, independentemente do servidor ou do telemóvel.
 */
export const TIMEZONES: { id: string; label: string }[] = [
  { id: "Africa/Luanda", label: "Luanda (Angola)" },
  { id: "Europe/Lisbon", label: "Lisboa (Portugal continental)" },
  { id: "Atlantic/Azores", label: "Açores" },
  { id: "Africa/Maputo", label: "Maputo (Moçambique)" },
  { id: "Atlantic/Cape_Verde", label: "Cabo Verde" },
  { id: "Africa/Sao_Tome", label: "São Tomé e Príncipe" },
  { id: "Africa/Bissau", label: "Guiné-Bissau" },
  { id: "Africa/Windhoek", label: "Windhoek (Namíbia)" },
  { id: "Africa/Johannesburg", label: "Joanesburgo (África do Sul)" },
  { id: "Africa/Kinshasa", label: "Kinshasa (RD Congo)" },
  { id: "Africa/Brazzaville", label: "Brazzaville (Congo)" },
  { id: "Africa/Lusaka", label: "Lusaca (Zâmbia)" },
  { id: "Africa/Lagos", label: "Lagos (Nigéria)" },
  { id: "America/Sao_Paulo", label: "São Paulo / Brasília" },
  { id: "Europe/Madrid", label: "Madrid" },
  { id: "Europe/Paris", label: "Paris" },
  { id: "Europe/London", label: "Londres" },
  { id: "Europe/Berlin", label: "Berlim" },
  { id: "America/New_York", label: "Nova Iorque" },
  { id: "America/Toronto", label: "Toronto" },
  { id: "Asia/Dubai", label: "Dubai" },
  { id: "Asia/Shanghai", label: "Xangai / Pequim" },
];

export const DEFAULT_TIMEZONE = "Africa/Luanda";

/** Fuso horário sugerido a partir do país por omissão dos telefones. */
export const COUNTRY_TIMEZONE: Record<string, string> = {
  AO: "Africa/Luanda",
  PT: "Europe/Lisbon",
  MZ: "Africa/Maputo",
  BR: "America/Sao_Paulo",
  CV: "Atlantic/Cape_Verde",
  ST: "Africa/Sao_Tome",
  GW: "Africa/Bissau",
  NA: "Africa/Windhoek",
  ZA: "Africa/Johannesburg",
  CD: "Africa/Kinshasa",
  CG: "Africa/Brazzaville",
  ZM: "Africa/Lusaka",
  NG: "Africa/Lagos",
  ES: "Europe/Madrid",
  FR: "Europe/Paris",
  GB: "Europe/London",
  DE: "Europe/Berlin",
  US: "America/New_York",
  CA: "America/Toronto",
  AE: "Asia/Dubai",
  CN: "Asia/Shanghai",
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

/** Instante de fim do evento a partir de "HH:MM" (no dia seguinte se for antes do início). Por omissão, 5 horas. */
export function eventEnd(start: Date, endTime: string | null | undefined, tz: string): Date {
  const m = /^(\d{1,2}):(\d{2})$/.exec((endTime ?? "").trim());
  if (!m) return new Date(start.getTime() + 5 * 3600_000);
  const day = dateToLocalDateInput(start, tz);
  let end = localInputToDate(`${day}T${m[1].padStart(2, "0")}:${m[2]}`, tz);
  if (!end) return new Date(start.getTime() + 5 * 3600_000);
  if (end <= start) {
    const next = new Date(start.getTime() + 24 * 3600_000);
    end = localInputToDate(`${dateToLocalDateInput(next, tz)}T${m[1].padStart(2, "0")}:${m[2]}`, tz) ?? end;
  }
  return end;
}

/** Dias de calendário (no fuso do evento) entre hoje e a data do evento: 0 = é hoje, negativo = já passou. */
export function calendarDaysUntil(date: Date, tz: string, now: Date = new Date()): number {
  const a = Date.parse(dateToLocalDateInput(now, tz) + "T00:00:00Z");
  const b = Date.parse(dateToLocalDateInput(date, tz) + "T00:00:00Z");
  return Math.round((b - a) / 86_400_000);
}
