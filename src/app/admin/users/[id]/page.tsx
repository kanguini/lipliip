import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isAdmin, requireAdmin } from "@/lib/admin";
import { formatDateTimeShort, formatEventDate, formatMoney } from "@/lib/format";
import { popSecret } from "@/lib/one-time";
import { appUrl } from "@/lib/urls";
import { eventTypeLabel } from "@/lib/event-types";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from "@/lib/activation";
import { generateResetLinkAction, setUserRoleAction, toggleSuspendUserAction } from "@/app/admin/actions";
import { Alert, BackLink, Badge, FlashFromSearch, PageHeader, StatCard } from "@/components/ui";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { SubmitButton } from "@/components/dashboard/SubmitButton";
import { KeyRound } from "lucide-react";

export const metadata = { title: "Utilizador · Administração" };

export default async function AdminUserPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string; reset?: string }> }) {
  const me = await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) notFound();
  const [user, events, memberships, orders] = await Promise.all([
    db.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, suspendedAt: true } }),
    db.event.findMany({ where: { ownerId: id }, orderBy: { date: "desc" }, select: { id: true, title: true, type: true, date: true, timezone: true, activatedAt: true, _count: { select: { guests: true } } } }),
    db.eventMember.findMany({ where: { userId: id }, select: { role: true, event: { select: { id: true, title: true } } } }),
    db.order.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, reference: true, amount: true, currency: true, status: true, createdAt: true, event: { select: { title: true } } } }),
  ]);
  if (!user) notFound();
  const self = user.id === me.id;
  const returnTo = `/admin/users/${user.id}`;
  const resetToken = popSecret(sp.reset);
  const resetLink = resetToken ? `${appUrl()}/reset?token=${encodeURIComponent(resetToken)}` : null;
  const resetGone = !!sp.reset && !resetLink;

  return (
    <>
      <BackLink href="/admin/users">Utilizadores</BackLink>
      <PageHeader title={user.name} subtitle={`${user.email}${user.phone ? ` · ${user.phone}` : ""} · conta criada ${formatDateTimeShort(user.createdAt)}`} />
      <FlashFromSearch ok={sp.ok} error={sp.error} />
      {resetLink && (
        <div className="mb-6">
          <Alert kind="success">
            <p className="font-semibold">Link de recuperação criado (válido 30 minutos). Só é mostrado agora: copie-o e envie-o ao utilizador.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="break-all rounded-lg bg-white/70 px-2 py-1 text-xs">{resetLink}</code>
              <CopyButton text={resetLink} label="Copiar link" />
            </div>
          </Alert>
        </div>
      )}
      {resetGone && (
        <div className="mb-6">
          <Alert kind="info">O link de recuperação só é mostrado uma vez, no momento em que é criado. Gere um novo se precisar de o enviar.</Alert>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Papel" value={isAdmin(user) ? "Admin" : "Utilizador"} />
        <StatCard label="Estado" value={user.suspendedAt ? "Suspenso" : "Ativo"} tone={user.suspendedAt ? "bad" : "good"} />
        <StatCard label="Eventos" value={events.length} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <div className="card space-y-3">
            <h2 className="font-semibold">Ações</h2>
            {self ? (
              <p className="text-sm text-muted">Esta é a sua conta: o papel e a suspensão só podem ser alterados por outro administrador.</p>
            ) : (
              <>
                <form action={setUserRoleAction.bind(null, user.id, user.role === "ADMIN" ? "USER" : "ADMIN", returnTo)}>
                  <ConfirmButton className="btn-secondary w-full" message={user.role === "ADMIN" ? `Retirar o papel de administrador a ${user.name}?` : `Tornar ${user.name} administrador da plataforma?`}>{user.role === "ADMIN" ? "Retirar administrador" : "Tornar administrador"}</ConfirmButton>
                </form>
                <form action={toggleSuspendUserAction.bind(null, user.id, returnTo)}>
                  <ConfirmButton className={`${user.suspendedAt ? "btn-secondary" : "btn-danger"} w-full`} message={user.suspendedAt ? `Reativar a conta de ${user.name}?` : `Suspender a conta de ${user.name}? As sessões são terminadas e deixa de poder entrar.`}>{user.suspendedAt ? "Reativar conta" : "Suspender conta"}</ConfirmButton>
                </form>
              </>
            )}
            <form action={generateResetLinkAction.bind(null, user.id)}>
              <SubmitButton className="btn-ghost w-full" pendingText="A gerar…"><KeyRound className="h-4 w-4" strokeWidth={1.75} aria-hidden />Gerar link de recuperação</SubmitButton>
              <p className="hint">Para quando o utilizador não recebe o email de recuperação. O link é mostrado uma vez e expira em 30 minutos.</p>
            </form>
          </div>
          {memberships.length > 0 && (
            <div className="card">
              <h2 className="font-semibold">Participa em</h2>
              <ul className="mt-2 space-y-1 text-sm">{memberships.map((m) => <li key={m.event.id}>{m.event.title} <span className="text-xs text-muted">· {m.role === "STAFF" ? "receção" : "editor"}</span></li>)}</ul>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold">Eventos de que é dono</h2>
            {events.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Ainda não criou eventos.</p>
            ) : (
              <ul className="mt-3 divide-y divide-brand-100 text-sm">
                {events.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span>
                      <span className="font-medium">{e.title}</span>
                      <span className="ml-2 text-xs text-muted">{eventTypeLabel(e.type)} · {formatEventDate(e.date, false, e.timezone)} · {e._count.guests} convidados</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {e.activatedAt ? <Badge tone="ok">Ativado</Badge> : <Badge tone="pending">Não ativado</Badge>}
                      <Link href={`/admin/events?q=${encodeURIComponent(e.title)}`} className="btn-ghost btn-sm">Ver</Link>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card">
            <h2 className="font-semibold">Pedidos de ativação</h2>
            {orders.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Sem pedidos.</p>
            ) : (
              <ul className="mt-3 divide-y divide-brand-100 text-sm">
                {orders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span><span className="font-mono">{o.reference}</span> <span className="text-xs text-muted">· {o.event.title} · {formatDateTimeShort(o.createdAt)}</span></span>
                    <span className="flex items-center gap-2">{formatMoney(o.amount, o.currency)}<span className={`badge ${ORDER_STATUS_STYLE[o.status] ?? ""}`}>{ORDER_STATUS_LABEL[o.status] ?? o.status}</span></span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/orders" className="mt-3 inline-block text-xs text-brand-700 underline">Gerir pagamentos</Link>
          </div>
        </div>
      </div>
    </>
  );
}
