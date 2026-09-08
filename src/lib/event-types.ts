export const EVENT_TYPES = {
  WEDDING: { label: "Casamento", emoji: "💍", hostLabel: "Nomes dos noivos", hostPlaceholder: "Ana & João" },
  ENGAGEMENT: { label: "Noivado", emoji: "💐", hostLabel: "Nomes do casal", hostPlaceholder: "Sofia & Miguel" },
  BIRTHDAY: { label: "Aniversário", emoji: "🎂", hostLabel: "Nome do aniversariante", hostPlaceholder: "Maria" },
  OTHER: { label: "Outro evento", emoji: "🎉", hostLabel: "Anfitrião(ões)", hostPlaceholder: "Família Silva" },
} as const;

export type EventType = keyof typeof EVENT_TYPES;

export function eventTypeLabel(type: string) {
  return EVENT_TYPES[type as EventType]?.label ?? "Evento";
}

export const RSVP_LABELS: Record<string, string> = {
  PENDING: "Sem resposta",
  ACCEPTED: "Confirmado",
  DECLINED: "Não vai",
};

export type ProgramItem = { time: string; title: string; description?: string };

export function parseProgram(json: string | null | undefined): ProgramItem[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((p) => p && p.title) : [];
  } catch {
    return [];
  }
}

/** Lê o programa escrito em texto: uma linha por momento, "HH:MM - Título - descrição". */
export function parseProgramText(text: string): ProgramItem[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [time, title, ...rest] = line.split(/\s[-–|]\s/);
      if (!title) return { time: "", title: time };
      return { time: time.trim(), title: title.trim(), description: rest.join(" - ").trim() || undefined };
    });
}

export function programToText(items: ProgramItem[]): string {
  return items
    .map((p) => [p.time, p.title, p.description].filter(Boolean).join(" - "))
    .join("\n");
}
