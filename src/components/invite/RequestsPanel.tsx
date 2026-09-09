"use client";

/**
 * Pedidos do convidado (comida, bebida, música, outro) a partir do convite.
 * (Ponto de montagem: a implementação completa chega na fase seguinte.)
 */
export type GuestRequestView = { id: string; kind: string; text: string; status: string; createdAt: Date };

export function RequestsPanel({ requests }: { token: string; guestName: string; requests: GuestRequestView[]; eventDate: Date }) {
  if (requests.length === 0) return null;
  return (
    <section className="invite-card" id="pedidos">
      <h2 className="text-2xl">Os seus pedidos</h2>
      <ul className="mt-3 space-y-1 text-sm">
        {requests.map((r) => (
          <li key={r.id}>{r.text}</li>
        ))}
      </ul>
    </section>
  );
}
