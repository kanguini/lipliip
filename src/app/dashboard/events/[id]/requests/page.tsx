import { db } from "@/lib/db";
import { requireEventAccess } from "@/lib/access";
import { formatTime } from "@/lib/format";
import { setRequestsEnabledAction, toggleRequestStatusAction } from "@/app/dashboard/reception-actions";
import { FlashFromSearch, StatCard } from "@/components/ui";
import { SubmitButton } from "@/components/dashboard/SubmitButton";
import { AutoRefresh } from "@/components/dashboard/AutoRefresh";
import { RequestKindBadge } from "@/components/dashboard/RequestKindBadge";
import { Check, RotateCcw } from "lucide-react";

type RequestRow = { id: string; kind: string; text: string; status: string; createdAt: Date; doneAt: Date | null; guest: { name: string; tableNumber: string | null } };

function RequestItem({ r, eventId, tz }: { r: RequestRow; eventId: string; tz: string }) {
  const done = r.status === "DONE";
  return (
    <li className={`flex items-start justify-between gap-3 rounded-2xl p-3 text-sm ${done ? "bg-stone-50 opacity-75" : "bg-brand-50"}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <RequestKindBadge kind={r.kind} />
          <span className="font-medium">{r.guest.name}</span>
          {r.guest.tableNumber && <span className="badge bg-white text-brand-700">Mesa {r.guest.tableNumber}</span>}
          <span className="text-xs text-muted">{formatTime(r.createdAt, tz)}{done && r.doneAt ? ` · feito às ${formatTime(r.doneAt, tz)}` : ""}</span>
        </div>
        <p className="mt-1 break-words">{r.text}</p>
      </div>
      <form action={toggleRequestStatusAction.bind(null, eventId, r.id)} className="flex-none">
        <SubmitButton className={done ? "btn-ghost btn-sm" : "btn-primary btn-sm"} pendingText="…">
          {done ? <><RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />Reabrir</> : <><Check className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />Feito</>}
        </SubmitButton>
      </form>
    </li>
  );
}

export default async function RequestsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { event, role } = await requireEventAccess(id, { allowStaff: true });
  const requests = await db.guestRequest.findMany({
    where: { eventId: id },
    select: { id: true, kind: true, text: true, status: true, createdAt: true, doneAt: true, guest: { select: { name: true, tableNumber: true } } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  // Por atender: os mais antigos primeiro (fila). Feitos: os mais recentes primeiro.
  const open = requests.filter((r) => r.status !== "DONE").reverse();
  const done = requests.filter((r) => r.status === "DONE");
  const tz = event.timezone;

  return (
    <>
      <AutoRefresh seconds={20} />
      <FlashFromSearch {...sp} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Por atender" value={open.length} tone={open.length ? "warn" : "default"} />
        <StatCard label="Feitos" value={done.length} tone="good" />
        <StatCard label="Total de pedidos" value={requests.length} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <div className="card space-y-3">
            <h2 className="font-semibold">Pedidos dos convidados</h2>
            <p className="text-sm text-muted">Os convidados pedem comida, bebida ou música a partir do convite. Esta página atualiza-se sozinha a cada 20 segundos; também pode ser usada na receção sem conta (ver Check-in).</p>
            {role !== "STAFF" ? (
              <form action={setRequestsEnabledAction.bind(null, id)} className="space-y-3 border-t border-brand-100 pt-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="requestsEnabled" defaultChecked={event.requestsEnabled} />
                  Permitir pedidos a partir do convite
                </label>
                <SubmitButton className="btn-secondary btn-sm" pendingText="A guardar…">Guardar</SubmitButton>
              </form>
            ) : (
              <p className="text-xs text-muted">Pedidos {event.requestsEnabled ? "ativados" : "desativados"} pelos anfitriões.</p>
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold">Por atender ({open.length})</h2>
            {open.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Nenhum pedido em espera. Quando um convidado pedir alguma coisa, aparece aqui.</p>
            ) : (
              <ul className="mt-3 space-y-2">{open.map((r) => <RequestItem key={r.id} r={r} eventId={id} tz={tz} />)}</ul>
            )}
          </div>
          {done.length > 0 && (
            <div className="card">
              <h2 className="font-semibold">Feitos ({done.length})</h2>
              <ul className="mt-3 space-y-2">{done.map((r) => <RequestItem key={r.id} r={r} eventId={id} tz={tz} />)}</ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
