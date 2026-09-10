"use client";

import Link from "next/link";
import { Frown } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Frown className="h-14 w-14 text-brand-400" strokeWidth={1.75} aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold">Algo correu mal</h1>
      <p className="mt-2 max-w-md text-sm text-muted">Ocorreu um erro inesperado. Tente novamente; se persistir, contacte-nos.{error.digest ? ` (ref. ${error.digest})` : ""}</p>
      <div className="mt-6 flex gap-2">
        <button className="btn-primary" onClick={reset}>Tentar de novo</button>
        <Link href="/" className="btn-secondary">Página inicial</Link>
      </div>
    </main>
  );
}
