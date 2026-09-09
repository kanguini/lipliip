"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction, type AuthState } from "./actions";

export function AuthForm({ mode, notice }: { mode: "login" | "register"; notice?: string }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="wordmark block text-center text-4xl" aria-label="Liplip">liplip<span>.</span></Link>
        <div className="card mt-6">
          <h1 className="text-xl font-semibold">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {mode === "login" ? "Bem-vindo de volta." : "Comece a criar os seus convites em segundos."}
          </p>
          {notice && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{notice}</p>}
          <form action={formAction} className="mt-6 space-y-4">
            {mode === "register" && (
              <div>
                <label className="label" htmlFor="name">Nome</label>
                <input id="name" name="name" className="input" required autoComplete="name" defaultValue={state.name ?? ""} />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="input" required autoComplete="email" defaultValue={state.email ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="password">Palavra-passe</label>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                required
                minLength={mode === "register" ? 8 : undefined}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
            {state.error && <p className="text-sm text-red-700" role="alert">{state.error}</p>}
            {mode === "login" && <p className="text-right text-xs"><Link href="/forgot" className="text-stone-500 underline">Esqueceu-se da palavra-passe?</Link></p>}
            <button className="btn-primary w-full" disabled={pending}>
              {pending ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-sm text-stone-500">
          {mode === "login" ? (
            <>Ainda não tem conta? <Link href="/register" className="text-brand-700 underline">Criar conta</Link></>
          ) : (
            <>Já tem conta? <Link href="/login" className="text-brand-700 underline">Entrar</Link></>
          )}
        </p>
      </div>
    </main>
  );
}
