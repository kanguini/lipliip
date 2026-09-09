import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { StatCard } from "@/components/ui";

/** Painel geral: números da plataforma e o que precisa de atenção. */
export default async function AdminHome() {
  await requireAdmin();
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [users, newUsers, events, activeEvents, guests, pendingOrders, newServiceRequests, suppliers] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: since } } }),
    db.event.count(),
    db.event.count({ where: { activatedAt: { not: null } } }),
    db.guest.count(),
    db.order.count({ where: { status: "PENDING" } }),
    db.serviceRequest.count({ where: { status: "NEW" } }),
    db.supplier.count({ where: { active: true } }),
  ]);
  return (
    <>
      <p className="eyebrow">Administração</p>
      <h1 className="display-title mt-2 text-4xl">A plataforma <em>hoje</em>.</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Utilizadores" value={<>{users}<span className="text-base text-muted"> · {newUsers} novos em 30 dias</span></>} />
        <StatCard label="Eventos" value={<>{events}<span className="text-base text-muted"> · {activeEvents} ativados</span></>} />
        <StatCard label="Convidados" value={guests} />
        <StatCard label="Fornecedores ativos" value={suppliers} />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/admin/orders" className="card transition hover:-translate-y-0.5">
          <p className="font-display text-3xl">{pendingOrders}</p>
          <p className="text-sm text-muted">pagamentos à espera de aprovação</p>
        </Link>
        <Link href="/admin/service-requests" className="card transition hover:-translate-y-0.5">
          <p className="font-display text-3xl">{newServiceRequests}</p>
          <p className="text-sm text-muted">pedidos de serviços por responder</p>
        </Link>
      </div>
    </>
  );
}
