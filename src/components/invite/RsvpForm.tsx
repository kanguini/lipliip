"use client";

import { useActionState, useState } from "react";
import { rsvpAction, type ActionResult } from "@/app/c/[token]/actions";
import { Check, Music, X } from "lucide-react";

type Props = {
  token: string;
  maxCompanions: number;
  allowChildren: boolean;
  current: { rsvpStatus: string; companions: number; companionNames: string | null; dietaryNotes: string | null; rsvpMessage: string | null; songRequest: string | null };
  deadlinePassed: boolean;
  deadlineLabel?: string;
  songRequests?: boolean;
};

export function RsvpForm({ token, maxCompanions, allowChildren, current, deadlinePassed, deadlineLabel, songRequests }: Props) {
  const [status, setStatus] = useState(current.rsvpStatus === "PENDING" ? "ACCEPTED" : current.rsvpStatus);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    async (_prev, fd) => rsvpAction(token, fd),
    { ok: false },
  );
  const answered = current.rsvpStatus !== "PENDING";

  return (
    <section className="invite-card" id="rsvp">
      <h2 className="text-2xl">Confirmar presença</h2>
      {answered && (
        <p className="mt-2 rounded-lg px-3 py-2 text-sm" style={{ background: "color-mix(in srgb, var(--inv-accent) 15%, transparent)" }}>
          {current.rsvpStatus === "ACCEPTED"
            ? `Obrigado! Presença confirmada${current.companions ? ` com ${current.companions} acompanhante(s)` : ""}. Pode alterar a resposta abaixo.`
            : "Registámos que não poderá estar presente. Pode alterar a resposta abaixo."}
        </p>
      )}
      {deadlineLabel && !deadlinePassed && <p className="mt-2 text-sm opacity-70">Por favor responda até {deadlineLabel}.</p>}
      {deadlinePassed ? (
        <p className="mt-3 text-sm opacity-70">O prazo para responder terminou. Contacte os anfitriões se precisar de alterar algo.</p>
      ) : (
        <form action={formAction} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              ["ACCEPTED", "Sim, vou!"],
              ["DECLINED", "Não posso ir"],
            ].map(([v, l]) => (
              <label
                key={v}
                className="cursor-pointer rounded-xl border-2 px-4 py-3 text-center text-sm font-semibold transition"
                style={{
                  borderColor: status === v ? "var(--inv-accent)" : "color-mix(in srgb, var(--inv-accent) 25%, transparent)",
                  background: status === v ? "color-mix(in srgb, var(--inv-accent) 12%, transparent)" : "transparent",
                }}
              >
                <input type="radio" name="status" value={v} className="sr-only" checked={status === v} onChange={() => setStatus(v)} />
                <span className="inline-flex items-center justify-center gap-1.5">{v === "ACCEPTED" ? <Check className="h-4 w-4" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}{l}</span>
              </label>
            ))}
          </div>

          {status === "ACCEPTED" && (
            <>
              {maxCompanions > 0 && (
                <div>
                  <label className="mb-1 block text-sm font-medium">Acompanhantes (até {maxCompanions})</label>
                  <select name="companions" className="invite-input" defaultValue={current.companions}>
                    {Array.from({ length: maxCompanions + 1 }).map((_, i) => (
                      <option key={i} value={i}>{i === 0 ? "Vou sozinho/a" : `+${i}`}</option>
                    ))}
                  </select>
                  <input name="companionNames" className="invite-input mt-2" placeholder="Nomes dos acompanhantes" defaultValue={current.companionNames ?? ""} />
                  {!allowChildren && <p className="mt-1 text-xs opacity-70">Este evento é apenas para adultos.</p>}
                </div>
              )}
              {songRequests && (
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-sm font-medium"><Music className="invite-accent h-4 w-4" aria-hidden />Que música não pode faltar na festa?</label>
                  <input name="songRequest" className="invite-input" placeholder="Artista - Música" defaultValue={current.songRequest ?? ""} />
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium">Restrições alimentares ou alergias</label>
                <input name="dietaryNotes" className="invite-input" placeholder="Ex: vegetariano, sem glúten" defaultValue={current.dietaryNotes ?? ""} />
              </div>
            </>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Mensagem para os anfitriões (opcional)</label>
            <textarea name="rsvpMessage" className="invite-input" rows={2} defaultValue={current.rsvpMessage ?? ""} />
          </div>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state.ok && <p className="text-sm font-medium">Resposta guardada. Obrigado!</p>}
          <button className="invite-btn w-full" disabled={pending}>{pending ? "A guardar…" : answered ? "Atualizar resposta" : "Enviar resposta"}</button>
        </form>
      )}
    </section>
  );
}
