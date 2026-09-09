"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestResetAction, type ResetState } from "../reset-actions";

export function ForgotForm({ emailConfigured }: { emailConfigured: boolean }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(requestResetAction, {});
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="wordmark block text-center text-4xl" aria-label="Liplip">liplip<span>.</span></Link>
        <div className="card mt-6">
          <h1 className="text-xl font-semibold">Recuperar palavra-passe</h1>
          {!emailConfigured ? (
            <p className="mt-3 text-sm text-stone-600">O envio de emails ainda não está configurado nesta instalação. Contacte o administrador da plataforma para repor a sua palavra-passe.</p>
          ) : state.done ? (
            <p className="mt-3 text-sm text-stone-600">Se existir uma conta com esse email, enviámos um link para definir uma nova palavra-passe. Verifique também a pasta de spam.</p>
          ) : (
            <form action={action} className="mt-4 space-y-4">
              <div>
                <label className="label" htmlFor="email">Email da conta</label>
                <input id="email" name="email" type="email" className="input" required autoComplete="email" />
              </div>
              {state.error && <p className="text-sm text-red-700">{state.error}</p>}
              <button className="btn-primary w-full" disabled={pending}>{pending ? "A enviar…" : "Enviar link de recuperação"}</button>
            </form>
          )}
        </div>
        <p className="mt-4 text-center text-sm text-stone-500"><Link href="/login" className="text-brand-700 underline">Voltar ao login</Link></p>
      </div>
    </main>
  );
}
