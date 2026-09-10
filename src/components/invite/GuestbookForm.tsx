"use client";

import { useActionState } from "react";
import { guestbookAction, type ActionResult } from "@/app/c/[token]/actions";

export function GuestbookForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(async (_p, fd) => guestbookAction(token, fd), { ok: false });
  return (
    <form action={formAction} className="mt-4 space-y-2">
      <label htmlFor="gb-message" className="sr-only">Mensagem para os anfitriões</label>
      <textarea id="gb-message" name="message" className="invite-input" rows={3} placeholder="Deixe uma mensagem carinhosa para os anfitriões…" required minLength={2} maxLength={600} />
      {state.error && <p className="text-sm invite-error">{state.error}</p>}
      {state.ok && <p className="text-sm font-medium">Mensagem enviada. Obrigado!</p>}
      <button className="invite-btn" disabled={pending}>{pending ? "A enviar…" : "Enviar mensagem"}</button>
    </form>
  );
}
