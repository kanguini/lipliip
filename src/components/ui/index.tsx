import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display-title text-4xl">{title}<span className="plum">.</span></h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Iniciais do utilizador num círculo (avatar). Tamanho por omissão 10 (2.5rem). */
export function Avatar({ name, size = 10, className = "" }: { name: string; size?: 8 | 9 | 10 | 12; className?: string }) {
  const sizes = { 8: "h-8 w-8 text-base", 9: "h-9 w-9 text-lg", 10: "h-10 w-10 text-lg", 12: "h-12 w-12 text-xl" };
  return (
    <span className={`flex flex-none items-center justify-center rounded-full bg-joy-sun font-display text-brand-800 ${sizes[size]} ${className}`} aria-hidden>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

/** Selo de estado com uma cor semântica. Base do RsvpBadge e dos estados de fornecedor/pedido/pagamento/utilizador. */
const BADGE_TONES = {
  pending: "bg-[#f8f0de] text-[#8b6b2d]",
  ok: "bg-[#e9f2eb] text-[#416c4a]",
  bad: "bg-[#f4e8eb] text-[#97596a]",
  muted: "bg-[#eeeaee] text-[#6d5e69]",
  info: "bg-[#e6eef8] text-[#2f4f7a]",
  brand: "bg-brand-100 text-brand-700",
} as const;
export type BadgeTone = keyof typeof BADGE_TONES;
export function Badge({ tone = "muted", className = "", children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return <span className={`badge ${BADGE_TONES[tone]} ${className}`}>{children}</span>;
}

/** Filtros por segmento (radio-like) apresentados como pills. `param` é a chave da querystring. */
export function FilterPills({ param, options, active }: { param: string; options: [value: string, label: string][]; active: string }) {
  return (
    <div className="flex flex-wrap gap-1 text-sm">
      {options.map(([value, label]) => {
        const on = active === value;
        const qs = value ? `?${param}=${value}` : "?";
        return (
          <Link key={value} href={qs} className={`rounded-full px-3 py-1.5 transition ${on ? "bg-brand-700 text-white" : "text-muted hover:bg-brand-100"}`}>{label}</Link>
        );
      })}
    </div>
  );
}

export function StatCard({ label, value, tone = "default" }: { label: string; value: ReactNode; tone?: "default" | "good" | "bad" | "warn" }) {
  const tones = {
    default: "text-brand-700",
    good: "text-emerald-800",
    bad: "text-red-800",
    warn: "text-amber-800",
  };
  return (
    <div className="card">
      <p className="text-[0.8125rem] text-muted">{label}</p>
      <p className={`font-display mt-1 text-4xl font-normal ${tones[tone]}`}>{value}</p>
    </div>
  );
}

export function RsvpBadge({ status }: { status: string }) {
  const tone: Record<string, BadgeTone> = { PENDING: "pending", ACCEPTED: "ok", DECLINED: "bad", SUSPENDED: "muted" };
  const label: Record<string, string> = { PENDING: "Por confirmar", ACCEPTED: "Confirmado", DECLINED: "Não vai", SUSPENDED: "Suspenso" };
  return <Badge tone={tone[status] ?? "pending"}>{label[status] ?? status}</Badge>;
}

export function Alert({ kind = "info", children }: { kind?: "info" | "error" | "success" | "warn"; children: ReactNode }) {
  const cls = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    error: "border-red-200 bg-red-50 text-red-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
  }[kind];
  return <div className={`rounded-lg border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center py-14 text-center">
      <p className="font-display text-2xl">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand-700">
      <ChevronLeft className="h-4 w-4" aria-hidden />{children}
    </Link>
  );
}

/** Lê ?ok= e ?error= da URL e mostra a mensagem correspondente. */
export function FlashFromSearch({ ok, error }: { ok?: string; error?: string }) {
  if (error) return <div className="mb-4"><Alert kind="error">{error}</Alert></div>;
  if (ok) return <div className="mb-4"><Alert kind="success">{ok}</Alert></div>;
  return null;
}
