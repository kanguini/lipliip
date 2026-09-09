import { describe, expect, it } from "vitest";
import { buildNotifications, countUnread, relativeTime, unreadBadge, type NotificationSources } from "@/lib/notifications";

const now = new Date("2026-09-09T12:00:00Z");
const ago = (hours: number) => new Date(now.getTime() - hours * 3600_000);
const ev = { title: "Casamento de Ana & João" };

function sources(over: Partial<NotificationSources> = {}): NotificationSources {
  return {
    rsvps: [
      { id: "g1", name: "Rui", rsvpStatus: "ACCEPTED", companions: 2, respondedAt: ago(1), eventId: "e1", event: ev },
      { id: "g2", name: "Sara", rsvpStatus: "DECLINED", companions: 0, respondedAt: ago(30), eventId: "e1", event: ev },
      { id: "g3", name: "Zé", rsvpStatus: "PENDING", companions: 0, respondedAt: null, eventId: "e1", event: ev },
    ],
    guestbook: [{ id: "b1", message: "Muitas felicidades!", createdAt: ago(2), eventId: "e1", guest: { name: "Rui" }, event: ev }],
    requests: [{ id: "r1", kind: "MUSIC", text: "Kizomba, por favor", createdAt: ago(0.5), eventId: "e1", guest: { name: "Sara" }, event: ev }],
    photos: [{ id: "p1", caption: null, createdAt: ago(24 * 20), eventId: "e1", guest: { name: "Rui" }, event: ev }],
    orders: [
      { id: "o1", status: "APPROVED", reviewedAt: ago(5), eventId: "e1", event: ev },
      { id: "o2", status: "PENDING", reviewedAt: null, eventId: "e1", event: ev },
    ],
    ...over,
  };
}

describe("buildNotifications", () => {
  it("junta as fontes, ordena por data decrescente e ignora o que está fora da janela", () => {
    const items = buildNotifications(sources(), { readAt: null, now });
    expect(items.map((i) => i.kind)).toEqual(["REQUEST", "RSVP", "GUESTBOOK", "ORDER", "RSVP"]);
    expect(items.find((i) => i.kind === "PHOTO")).toBeUndefined(); // 20 dias > 14 dias
    expect(items.some((i) => i.title.includes("Zé"))).toBe(false); // sem resposta
    expect(items.some((i) => i.id.startsWith("order:o2"))).toBe(false); // pendente
  });
  it("gera títulos e links úteis", () => {
    const items = buildNotifications(sources(), { readAt: null, now });
    const rsvp = items.find((i) => i.id.startsWith("rsvp:g1"))!;
    expect(rsvp.title).toBe("Rui confirmou presença");
    expect(rsvp.detail).toBe("Leva 2 acompanhantes.");
    expect(rsvp.href).toBe("/dashboard/events/e1/guests/g1");
    expect(items.find((i) => i.kind === "ORDER")!.href).toBe("/dashboard/events/e1/activate");
    expect(items.find((i) => i.kind === "REQUEST")!.title).toContain("(música)");
  });
  it("marca como não lidos só os itens posteriores a readAt", () => {
    const items = buildNotifications(sources(), { readAt: ago(3), now });
    expect(items.filter((i) => i.unread).map((i) => i.kind)).toEqual(["REQUEST", "RSVP", "GUESTBOOK"]);
    expect(countUnread(items)).toBe(3);
    expect(countUnread(buildNotifications(sources(), { readAt: now, now }))).toBe(0);
  });
  it("respeita o limite", () => {
    expect(buildNotifications(sources(), { readAt: null, now, limit: 2 })).toHaveLength(2);
  });
});

describe("unreadBadge", () => {
  it("mostra o número e limita a 9+", () => {
    expect(unreadBadge(0)).toBe("");
    expect(unreadBadge(3)).toBe("3");
    expect(unreadBadge(9)).toBe("9");
    expect(unreadBadge(42)).toBe("9+");
  });
});

describe("relativeTime", () => {
  it("descreve o tempo em pt-PT", () => {
    expect(relativeTime(now, now)).toBe("agora");
    expect(relativeTime(ago(0.25), now)).toBe("há 15 min");
    expect(relativeTime(ago(3), now)).toBe("há 3 h");
    expect(relativeTime(ago(30), now)).toBe("ontem");
    expect(relativeTime(ago(72), now)).toBe("há 3 dias");
  });
});
