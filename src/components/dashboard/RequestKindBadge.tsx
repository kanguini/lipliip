import { CupSoda, MessageSquare, Music, UtensilsCrossed } from "lucide-react";

export const REQUEST_KIND_LABELS: Record<string, string> = { FOOD: "Comida", DRINK: "Bebida", MUSIC: "Música", OTHER: "Outro" };

const STYLES: Record<string, string> = {
  FOOD: "bg-[#fff1d6] text-[#8b6b2d]",
  DRINK: "bg-[#e3f1fb] text-[#2f5d80]",
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
