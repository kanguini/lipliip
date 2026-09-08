"use client";

import { useState, useTransition } from "react";
import { cancelReservationAction, reserveGiftAction } from "@/app/c/[token]/actions";
import { formatMoney } from "@/lib/format";

export type GiftView = {
  id: string;
  kind: string;
  name: string;
  description: string | null;
  price: number | null;
  imageUrl: string | null;
  storeUrl: string | null;
  quantity: number;
  reservedByOthers: number;
  mine: { quantity: number; amount: number | null; note: string | null } | null;
};

export function GiftList({
  token,
  gifts,
  currency,
  contribution,
}: {
  token: string;
  gifts: GiftView[];
  currency: string;
  contribution: { iban: string | null; mbway: string | null; note: string | null };
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [openId, setOpenId] = useState<string | null>(null);

  function reserve(giftId: string, fd: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await reserveGiftAction(token, giftId, fd);
      if (!res.ok) setError(res.error ?? "Erro");
      else setOpenId(null);
    });
  }
  function cancel(giftId: string) {
    setError(null);
    startTransition(async () => {
      const res = await cancelReservationAction(token, giftId);
      if (!res.ok) setError(res.error ?? "Erro");
    });
  }

  const hasContribution = contribution.iban || contribution.mbway;

  return (
    <section className="invite-card" id="presentes">
      <h2 className="text-2xl">Lista de presentes</h2>
      <p className="mt-1 text-sm opacity-70">A sua presença é o melhor presente. Se quiser mimar-nos, escolha algo da lista: ao reservar, mais ninguém o vê disponível.</p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-4 space-y-3">
        {gifts.map((g) => {
          const available = g.kind === "CASH" ? 1 : g.quantity - g.reservedByOthers - (g.mine?.quantity ?? 0);
          const soldOut = g.kind !== "CASH" && available <= 0 && !g.mine;
          return (
            <li key={g.id} className="flex gap-4 rounded-xl border p-3" style={{ borderColor: "color-mix(in srgb, var(--inv-accent) 20%, transparent)", opacity: soldOut ? 0.55 : 1 }}>
              {g.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.imageUrl} alt="" className="h-20 w-20 flex-none rounded-lg object-cover" />
              ) : (
                <div className="flex h-20 w-20 flex-none items-center justify-center rounded-lg text-3xl" style={{ background: "color-mix(in srgb, var(--inv-accent) 12%, transparent)" }}>
                  {g.kind === "CASH" ? "💝" : "🎁"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="font-semibold">{g.name}</p>
                  {g.price != null && <p className="invite-accent text-sm font-semibold">{formatMoney(g.price, currency)}</p>}
                </div>
                {g.description && <p className="mt-0.5 text-sm opacity-80">{g.description}</p>}
                {g.storeUrl && (
                  <a href={g.storeUrl} target="_blank" rel="noreferrer" className="invite-accent text-xs underline">Ver na loja ↗</a>
                )}
                {g.kind !== "CASH" && g.quantity > 1 && (
                  <p className="mt-1 text-xs opacity-60">{Math.max(available, 0)} de {g.quantity} disponíveis</p>
                )}

                <div className="mt-2">
                  {g.mine ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "color-mix(in srgb, var(--inv-accent) 18%, transparent)" }}>
                        {g.kind === "CASH" ? `Contribuição: ${formatMoney(g.mine.amount ?? 0, currency)}` : "Reservado por si"}
                      </span>
                      <button className="text-xs underline opacity-70" onClick={() => cancel(g.id)} disabled={pending}>cancelar</button>
                    </div>
                  ) : soldOut ? (
                    <span className="text-xs font-medium">Já reservado</span>
                  ) : openId === g.id ? (
                    <form action={(fd) => reserve(g.id, fd)} className="space-y-2">
                      {g.kind === "CASH" ? (
                        <input name="amount" className="invite-input" inputMode="decimal" placeholder={`Valor em ${currency}`} required />
                      ) : (
                        available > 1 && (
                          <select name="quantity" className="invite-input" defaultValue={1}>
                            {Array.from({ length: available }).map((_, i) => (
                              <option key={i} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                        )
                      )}
                      <input name="note" className="invite-input" placeholder="Nota (opcional)" />
                      <div className="flex gap-2">
                        <button className="invite-btn btn-sm" disabled={pending}>{g.kind === "CASH" ? "Contribuir" : "Reservar"}</button>
                        <button type="button" className="invite-btn-outline btn-sm" onClick={() => setOpenId(null)}>Cancelar</button>
                      </div>
                    </form>
                  ) : (
                    <button className="invite-btn-outline btn-sm" onClick={() => setOpenId(g.id)} disabled={pending}>
                      {g.kind === "CASH" ? "Quero contribuir" : "Reservar este presente"}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {hasContribution && (
        <div className="mt-5 rounded-xl p-4 text-sm" style={{ background: "color-mix(in srgb, var(--inv-accent) 10%, transparent)" }}>
          <p className="font-semibold">Prefere contribuir diretamente?</p>
          {contribution.note && <p className="mt-1 opacity-80">{contribution.note}</p>}
          {contribution.iban && <p className="mt-2">IBAN: <span className="font-mono">{contribution.iban}</span></p>}
          {contribution.mbway && <p>MB WAY: <span className="font-mono">{contribution.mbway}</span></p>}
        </div>
      )}
    </section>
  );
}
