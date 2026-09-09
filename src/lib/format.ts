const DEFAULT_TZ = "Europe/Lisbon";

function cap(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatEventDate(date: Date, withWeekday = true, tz: string = DEFAULT_TZ): string {
  return cap(
    new Intl.DateTimeFormat("pt-PT", {
      timeZone: tz,
      weekday: withWeekday ? "long" : undefined,
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date),
  );
}

export function formatTime(date: Date, tz: string = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("pt-PT", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(date);
}

export function formatDateTimeShort(date: Date, tz: string = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("pt-PT", { timeZone: tz, dateStyle: "short", timeStyle: "short" }).format(date);
}

/** Moedas disponíveis nas definições do evento (a primeira é a por omissão). */
export const CURRENCIES: { code: string; label: string }[] = [
  { code: "AOA", label: "Kwanza (AOA)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "USD", label: "Dólar americano (USD)" },
  { code: "BRL", label: "Real brasileiro (BRL)" },
  { code: "MZN", label: "Metical (MZN)" },
  { code: "ZAR", label: "Rand (ZAR)" },
  { code: "CVE", label: "Escudo cabo-verdiano (CVE)" },
  { code: "STN", label: "Dobra (STN)" },
  { code: "GBP", label: "Libra (GBP)" },
];

export const DEFAULT_CURRENCY = "AOA";

/**
 * Símbolos que o Intl em pt-PT não conhece (mostra o código "AOA", pouco natural para quem usa a moeda).
 * Formato: "1234,50 Kz".
 */
const CURRENCY_SYMBOL_OVERRIDES: Record<string, string> = {
  AOA: "Kz",
  MZN: "MT",
  STN: "Db",
};

export function formatMoney(value: number, currency = DEFAULT_CURRENCY): string {
  const code = currency.toUpperCase();
  const symbol = CURRENCY_SYMBOL_OVERRIDES[code];
  try {
    if (symbol) {
      const n = new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
      return `${n} ${symbol}`;
    }
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: code }).format(value);
  } catch {
    return `${value.toFixed(2)} ${symbol ?? code}`;
  }
}

