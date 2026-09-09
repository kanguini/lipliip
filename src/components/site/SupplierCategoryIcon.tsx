import { Building2, Cake, Camera, Car, Flower2, Lightbulb, Music, Package, PartyPopper, Printer, Scissors, Shirt, UtensilsCrossed, type LucideIcon } from "lucide-react";
import type { SupplierCategory } from "@/lib/suppliers";

const ICONS: Record<SupplierCategory, LucideIcon> = {
  VENUE: Building2,
  CATERING: UtensilsCrossed,
  DECOR: Flower2,
  MUSIC: Music,
  PHOTO: Camera,
  SOUND: Lightbulb,
  CAKES: Cake,
  PRINT: Printer,
  TRANSPORT: Car,
  FASHION: Shirt,
  BEAUTY: Scissors,
  ENTERTAINMENT: PartyPopper,
  OTHER: Package,
};

export function supplierCategoryIcon(category: string): LucideIcon {
  return ICONS[category as SupplierCategory] ?? Package;
}

/** Ícone da categoria (usado nos cartões sem fotografia e nos filtros). */
export function SupplierCategoryIcon({ category, className = "h-5 w-5", strokeWidth = 1.75 }: { category: string; className?: string; strokeWidth?: number }) {
  const Icon = supplierCategoryIcon(category);
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}
