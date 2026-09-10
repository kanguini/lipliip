"use client";

import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { adminLoginAction, type AdminAuthState } from "./actions";

/** Formulário da entrada reservada à administração. Sóbrio e sem ligações para a área do cliente. */
export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState<AdminAuthState, FormData>(adminLoginAction, {});

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-900 px-6 py-12 text-white">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-joy-sun">
            <ShieldCheck className="h-6 w-6" strokeWidth={1.75} aria-hidden />
          </span>
          <p className="wordmark mt-4 text-3xl leading-none text-white">liplip<span className="text-joy-coral">.</span></p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-white/60">Administração</p>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-6 text-ink shadow-[0_16px_48px_rgba(0,0,0,0.35)]">
          <h1 className="text-xl font-semibold">Entrar na administração</h1>
          <p className="mt-1 text-sm text-muted">Área reservada à equipa da plataforma.</p>
          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="input" required autoComplete="email" defaultValue={state.email ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="password">Palavra-passe</label>
              <input id="password" name="password" type="password" className="input" required autoComplete="current-password" />
            </div>
            {state.error && <p className="text-sm text-red-700" role="alert">{state.error}</p>}
            <button className="btn-primary w-full" disabled={pending}>
              {pending ? "Aguarde…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
