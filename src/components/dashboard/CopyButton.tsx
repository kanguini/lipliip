"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ text, label = "Copiar link", className = "btn-secondary btn-sm" }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          window.prompt("Copie o link:", text);
        }
      }}
    >
      {copied ? <><Check className="h-3.5 w-3.5" aria-hidden />Copiado</> : <><Copy className="h-3.5 w-3.5" aria-hidden />{label}</>}
    </button>
  );
}
