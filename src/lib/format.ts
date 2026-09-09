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

export function formatMoney(value: number, currency = "EUR"): string {
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

