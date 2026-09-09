import { Cake, Flower2, Gem, PartyPopper, type LucideProps } from "lucide-react";

const MAP = { WEDDING: Gem, ENGAGEMENT: Flower2, BIRTHDAY: Cake, OTHER: PartyPopper } as const;

/** Ícone de linha do tipo de evento, na cor da marca por omissão. */
export function EventIcon({ type, className = "h-7 w-7 text-brand-600", ...rest }: { type: string } & LucideProps) {
  const Icon = MAP[type as keyof typeof MAP] ?? PartyPopper;
  return <Icon className={className} strokeWidth={1.5} aria-hidden {...rest} />;
}
