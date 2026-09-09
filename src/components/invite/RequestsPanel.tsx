"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { CupSoda, Music, Trash2, UtensilsCrossed, MessageSquare, Check, Send } from "lucide-react";
import { createGuestRequestAction, deleteGuestRequestAction, type ActionResult } from "@/app/c/[token]/actions";

/**
 * Pedidos do convidado (comida, bebida, música, outro) a partir do convite. A equipa vê-os na receção
 * e no painel no dia do evento.
 */
export type GuestRequestView = { id: string; kind: string; text: string; status: string; createdAt: Date };

export const REQUEST_KIND_LABELS: Record<string, string> = { FOOD: "Comida", DRINK: "Bebida", MUSIC: "Música", OTHER: "Outro" };

function KindIcon({ kind, className = "h-4 w-4" }: { kind: string; className?: string }) {
  const props = { className, strokeWidth: 1.75, "aria-hidden": true } as const;
  if (kind === "FOOD") return <UtensilsCrossed {...props} />;
  if (kind === "DRINK") return <CupSoda {...props} />;
  if (kind === "MUSIC") return <Music {...props} />;
  return <MessageSquare {...props} />;
}

function timeLabel(d: Date, tz?: string) {
  try {
    return new Intl.DateTimeFormat("pt-PT", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(new Date(d));
  } catch {
    return new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit" }).format(new Date(d));
  }
}

export function RequestsPanel({ token, guestName, requests, tz }: { token: string; guestName: string; requests: GuestRequestView[]; eventDate: Date; tz?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [kind, setKind] = useState("FOOD");
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(async (_p, fd) => {
    const res = await createGuestRequestAction(token, fd);
    if (res.ok) formRef.current?.reset();
    return res;
  }, { ok: false });
  const firstName = guestName.split(" ")[0];

  return (
    <section className="invite-card" id="pedidos">
      <h2 className="text-2xl">Pedidos</h2>
      <p className="mt-1 text-sm opacity-70">{firstName}, precisa de alguma coisa durante a festa? Peça aqui. Os pedidos são vistos pela equipa no dia do evento.</p>
      <form ref={formRef} action={formAction} className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tipo de pedido">
          {Object.entries(REQUEST_KIND_LABELS).map(([k, label]) => (
            <label key={k} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${kind === k ? "invite-btn" : "invite-btn-outline"}`}>
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
              <KindIcon kind={k} className="h-3.5 w-3.5" />
              {label}
            </label>
          ))}
        </div>
        <div>
          <label className="sr-only" htmlFor="request-text">O seu pedido</label>
          <input
            id="request-text"
            name="text"
            className="invite-input"
            placeholder={kind === "FOOD" ? "Ex.: mais um prato vegetariano na mesa 4" : kind === "DRINK" ? "Ex.: uma água sem gás, por favor" : kind === "MUSIC" ? "Ex.: toquem uma kizomba!" : "Ex.: preciso de ajuda com…"}
            required
            minLength={2}
            maxLength={200}
            autoComplete="off"
          />
        </div>
        {state.error && <p className="text-sm invite-error">{state.error}</p>}
        {state.ok && !state.error && <p className="text-sm font-medium">Pedido enviado. A equipa vai tratar disso.</p>}
        <button className="invite-btn" disabled={pending} aria-busy={pending}>
          <Send className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          {pending ? "A enviar…" : "Enviar pedido"}
        </button>
      </form>
      {requests.length > 0 && (
        <ul className="mt-5 space-y-2">
          {requests.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 rounded-lg p-3 text-sm" style={{ background: "color-mix(in srgb, var(--inv-accent) 8%, transparent)" }}>
              <div className="flex min-w-0 items-start gap-2">
                <span className="invite-accent mt-0.5 flex-none"><KindIcon kind={r.kind} /></span>
                <div className="min-w-0">
                  <p className="break-words">{r.text}</p>
                  <p className="mt-0.5 text-xs opacity-60">
                    {REQUEST_KIND_LABELS[r.kind] ?? "Outro"} · {timeLabel(r.createdAt, tz)} ·{" "}
                    {r.status === "DONE" ? (
                      <span className="inline-flex items-center gap-1 font-medium"><Check className="h-3 w-3" strokeWidth={2} aria-hidden />Feito</span>
                    ) : (
                      "Enviado"
                    )}
                  </p>
                </div>
              </div>
              {r.status === "NEW" && (
                <button
                  type="button"
                  className="invite-btn-outline flex-none px-2.5 py-1 text-xs"
                  disabled={deleting}
                  aria-label="Apagar pedido"
                  onClick={() =>
                    startDelete(async () => {
                      const res = await deleteGuestRequestAction(token, r.id);
                      setDeleteError(res.ok ? null : (res.error ?? "Não foi possível apagar."));
                    })
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {deleteError && <p className="mt-2 text-sm invite-error">{deleteError}</p>}
    </section>
  );
}
