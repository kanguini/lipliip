function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toIcsDate(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

function escapeText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildIcs(opts: {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  durationHours?: number;
  url?: string;
}): string {
  const end = new Date(opts.start.getTime() + (opts.durationHours ?? 5) * 3600_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lipliip//Convites Digitais//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${opts.uid}`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(opts.start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeText(opts.title)}`,
  ];
  if (opts.description) lines.push(`DESCRIPTION:${escapeText(opts.description)}`);
  if (opts.location) lines.push(`LOCATION:${escapeText(opts.location)}`);
  if (opts.url) lines.push(`URL:${opts.url}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
