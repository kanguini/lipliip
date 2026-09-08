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

// ---------- Conteúdo extra do convite ----------

export type StoryItem = { date?: string; title: string; text?: string; imageUrl?: string };
export type PartyMember = { name: string; role?: string; imageUrl?: string };

function safeParseArray<T>(json: string | null | undefined, valid: (x: unknown) => x is T): T[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter(valid) : [];
  } catch {
    return [];
  }
}

const isUrl = (s: string) => /^https?:\/\//i.test(s.trim());
const splitFields = (line: string) => line.split(/\s[-–|]\s/).map((p) => p.trim());

/** Galeria: um URL de imagem por linha. */
export function parseGallery(json: string | null | undefined): string[] {
  return safeParseArray(json, (x): x is string => typeof x === "string");
}
export function parseGalleryText(text: string): string[] {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(isUrl);
}

/** História: "Data - Título - Texto - URL da foto" (data, texto e foto opcionais). */
export function parseStory(json: string | null | undefined): StoryItem[] {
  return safeParseArray(json, (x): x is StoryItem => !!x && typeof x === "object" && typeof (x as StoryItem).title === "string");
}
export function parseStoryText(text: string): StoryItem[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = splitFields(line);
      const imageUrl = isUrl(parts[parts.length - 1]) ? parts.pop() : undefined;
      if (parts.length === 1) return { title: parts[0], imageUrl };
      const [date, title, ...rest] = parts;
      return { date: date || undefined, title: title || date, text: rest.join(" - ") || undefined, imageUrl };
    });
}
export function storyToText(items: StoryItem[]): string {
  return items.map((i) => [i.date, i.title, i.text, i.imageUrl].filter(Boolean).join(" - ")).join("\n");
}

/** Padrinhos/madrinhas/damas: "Nome - Papel - URL da foto" (papel e foto opcionais). */
export function parseParty(json: string | null | undefined): PartyMember[] {
  return safeParseArray(json, (x): x is PartyMember => !!x && typeof x === "object" && typeof (x as PartyMember).name === "string");
}
export function parsePartyText(text: string): PartyMember[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = splitFields(line);
      const imageUrl = isUrl(parts[parts.length - 1]) ? parts.pop() : undefined;
      const [name, role] = parts;
      return { name, role: role || undefined, imageUrl };
    });
}
export function partyToText(items: PartyMember[]): string {
  return items.map((m) => [m.name, m.role, m.imageUrl].filter(Boolean).join(" - ")).join("\n");
}
