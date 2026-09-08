export function appUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function inviteUrl(token: string) {
  return `${appUrl()}/c/${token}`;
}

/** Mensagem pré-preenchida para enviar o link pessoal por WhatsApp/SMS. */
export function inviteShareMessage(opts: { guestName: string; hostNames: string; eventTitle: string; url: string }) {
  return (
    `Olá ${opts.guestName}! ${opts.hostNames} têm todo o gosto em convidar-te para: ${opts.eventTitle}.\n\n` +
    `Abre o teu convite pessoal aqui: ${opts.url}\n\n` +
    `Este link é só teu e pede confirmação pelo teu número de telemóvel. Por favor não o partilhes.`
  );
}

/** Link "Adicionar ao Google Calendar" (alternativa ao ficheiro .ics). */
export function googleCalendarUrl(opts: { title: string; start: Date; durationHours?: number; location?: string; details?: string }) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const end = new Date(opts.start.getTime() + (opts.durationHours ?? 5) * 3600_000);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${fmt(opts.start)}/${fmt(end)}`,
  });
  if (opts.location) p.set("location", opts.location);
  if (opts.details) p.set("details", opts.details);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
