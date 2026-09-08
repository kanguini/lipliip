import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, tone = "default" }: { label: string; value: ReactNode; tone?: "default" | "good" | "bad" | "warn" }) {
  const tones = {
    default: "text-stone-900",
    good: "text-emerald-700",
    bad: "text-red-700",
    warn: "text-amber-700",
  };
  return (
    <div className="card">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${tones[tone]}`}>{value}</p>
    </div>
  );
}

export function RsvpBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "badge bg-stone-100 text-stone-700",
    ACCEPTED: "badge bg-emerald-100 text-emerald-800",
    DECLINED: "badge bg-red-100 text-red-800",
  };
  const label: Record<string, string> = { PENDING: "Sem resposta", ACCEPTED: "Confirmado", DECLINED: "Não vai" };
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
    <div className="card flex flex-col items-center py-12 text-center">
      <p className="text-lg font-medium">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-stone-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900">
      ← {children}
    </Link>
  );
}

/** Lê ?ok= e ?error= da URL e mostra a mensagem correspondente. */
export function FlashFromSearch({ ok, error }: { ok?: string; error?: string }) {
  if (error) return <div className="mb-4"><Alert kind="error">{error}</Alert></div>;
  if (ok) return <div className="mb-4"><Alert kind="success">{ok}</Alert></div>;
  return null;
}
