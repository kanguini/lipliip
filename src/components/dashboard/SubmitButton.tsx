"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

/** Botão de submissão que se desativa enquanto a ação corre (evita duplos cliques com efeitos reais). */
export function SubmitButton({ children, pendingText = "A guardar…", className = "btn-primary" }: { children: React.ReactNode; pendingText?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
