"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestOtpAction, verifyOtpAction } from "@/app/c/[token]/actions";

export function OtpGate({ token, guestName, hostNames, maskedPhone }: { token: string; guestName: string; hostNames: string; maskedPhone: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "verify">("request");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function sendCode() {
    setError(null);
    startTransition(async () => {
      const res = await requestOtpAction(token);
      if (!res.ok) return setError(res.error ?? "Erro");
      setDevCode(res.devCode ?? null);
      setStep("verify");
    });
  }

  function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await verifyOtpAction(token, code);
      if (!res.ok) return setError(res.error ?? "Erro");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <div className="invite-card text-center">
        <p className="text-xs uppercase tracking-[0.3em] opacity-70">Convite de</p>
        <h1 className="invite-accent mt-2 text-4xl">{hostNames}</h1>
        <div className="invite-divider" />
        <p className="text-lg">Olá, <strong>{guestName}</strong>!</p>
        <p className="mt-2 text-sm opacity-80">
          Este convite é pessoal. Para o abrir, confirme o número de telemóvel <strong className="whitespace-nowrap">{maskedPhone}</strong> a que este convite foi enviado.
        </p>

        {step === "request" ? (
          <button className="invite-btn mt-6 w-full" onClick={sendCode} disabled={pending}>
            {pending ? "A enviar…" : "Enviar código por SMS"}
          </button>
        ) : (
          <form onSubmit={verify} className="mt-6 space-y-3">
            {devCode && (
              <p className="rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-900">
                Modo de desenvolvimento: o código é <strong>{devCode}</strong>
              </p>
            )}
            <input
              className="invite-input text-center text-2xl tracking-[0.5em]"
              inputMode="numeric"
              aria-label="Código de 6 dígitos"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              autoFocus
            />
            <button className="invite-btn w-full" disabled={pending || code.length !== 6}>
              {pending ? "A validar…" : "Abrir convite"}
            </button>
            <button type="button" className="text-xs underline opacity-70" onClick={sendCode} disabled={pending}>
              Não recebi o código, enviar de novo
            </button>
          </form>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
      <p className="mt-6 text-center text-xs opacity-60">
        Recebeu este link de outra pessoa? Os convites não podem ser transferidos. Fale com os anfitriões.
      </p>
    </div>
  );
}
