"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction, type ResetState } from "../reset-actions";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(resetPasswordAction, {});
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="font-display block text-center text-3xl font-semibold text-brand-700">Lipliip</Link>
        <div className="card mt-6">
          <h1 className="text-xl font-semibold">Definir nova palavra-passe</h1>
          <form action={action} className="mt-4 space-y-4">
            <input type="hidden" name="token" value={token} />
            <div>
              <label className="label" htmlFor="password">Nova palavra-passe</label>
              <input id="password" name="password" type="password" className="input" required minLength={8} autoComplete="new-password" />
            </div>
            {state.error && <p className="text-sm text-red-700">{state.error}</p>}
            <button className="btn-primary w-full" disabled={pending}>{pending ? "A guardar…" : "Guardar"}</button>
          </form>
        </div>
        <p className="mt-4 text-center text-sm text-stone-500"><Link href="/forgot" className="text-brand-700 underline">Pedir novo link</Link></p>
      </div>
    </main>
  );
}
