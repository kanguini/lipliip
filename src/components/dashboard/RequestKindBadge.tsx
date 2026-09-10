import { CupSoda, MessageSquare, Music, UtensilsCrossed } from "lucide-react";

export const REQUEST_KIND_LABELS: Record<string, string> = { FOOD: "Comida", DRINK: "Bebida", MUSIC: "Música", OTHER: "Outro" };

// Cores por tipo de pedido; amarelo e azul alinhados com os tons semânticos de `Badge`.
const STYLES: Record<string, string> = {
  FOOD: "bg-[#f8f0de] text-[#8b6b2d]",
  DRINK: "bg-[#e6eef8] text-[#2f4f7a]",
  MUSIC: "bg-[#ece5fb] text-[#5b4a8e]",
  OTHER: "bg-brand-100 text-brand-700",
};

/** Etiqueta do tipo de pedido (comida, bebida, música, outro) com ícone. */
export function RequestKindBadge({ kind }: { kind: string }) {
  const props = { className: "h-3.5 w-3.5", strokeWidth: 1.75, "aria-hidden": true } as const;
  const icon = kind === "FOOD" ? <UtensilsCrossed {...props} /> : kind === "DRINK" ? <CupSoda {...props} /> : kind === "MUSIC" ? <Music {...props} /> : <MessageSquare {...props} />;
  return (
    <span className={`badge gap-1 ${STYLES[kind] ?? STYLES.OTHER}`}>
      {icon}
      {REQUEST_KIND_LABELS[kind] ?? "Outro"}
    </span>
  );
}
