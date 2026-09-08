export function formatEventDate(date: Date, withWeekday = true): string {
  const text = new Intl.DateTimeFormat("pt-PT", {
    weekday: withWeekday ? "long" : undefined,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export function formatDateTimeShort(date: Date): string {
  return new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function formatMoney(value: number, currency = "EUR"): string {
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

/** Converte Date para o valor aceite por <input type="datetime-local"> (hora local do servidor). */
export function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toDateInput(date: Date): string {
  return toDateTimeLocal(date).slice(0, 10);
}

export function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}
