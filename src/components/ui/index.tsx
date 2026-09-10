import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
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
  const map: Record<string, string> = {
    PENDING: "badge bg-[#f8f0de] text-[#8b6b2d]",
    ACCEPTED: "badge bg-[#e9f2eb] text-[#416c4a]",
    DECLINED: "badge bg-[#f4e8eb] text-[#97596a]",
    SUSPENDED: "badge bg-[#eeeaee] text-[#6d5e69]",
  };
  const label: Record<string, string> = { PENDING: "Por confirmar", ACCEPTED: "Confirmado", DECLINED: "Não vai", SUSPENDED: "Suspenso" };
  return <span className={map[status] ?? map.PENDING}>{label[status] ?? status}</span>;
}

export function Alert({ kind = "info", children }: { kind?: "info" | "error" | "success"; children: ReactNode }) {
  const cls = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    error: "border-red-200 bg-red-50 text-red-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  }[kind];
  return <div className={`rounded-lg border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center py-14 text-center">
      <p className="font-display text-2xl">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-stone-500">{description}</p>}
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
