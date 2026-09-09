import { db } from "@/lib/db";
import { requireEventAccess } from "@/lib/access";
import { formatEventDate, formatMoney } from "@/lib/format";
import { calendarDaysUntil } from "@/lib/timezone";
import { BUDGET_CATEGORIES } from "@/lib/checklists";
import { addBudgetItemAction, addPaymentAction, deleteBudgetItemAction, deletePaymentAction, togglePaymentAction, updateBudgetItemAction } from "@/app/dashboard/planner-actions";
import Link from "next/link";
import { planForEvent } from "@/lib/platform";
import { Alert, FlashFromSearch, StatCard } from "@/components/ui";
import { Check, X, Plus } from "lucide-react";
import { SubmitButton } from "@/components/dashboard/SubmitButton";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";

export default async function BudgetPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { event } = await requireEventAccess(id);
  const [items, vendors, gifts, plan] = await Promise.all([
    db.budgetItem.findMany({ where: { eventId: id }, include: { payments: { orderBy: { dueAt: "asc" } }, vendor: true }, orderBy: [{ category: "asc" }, { createdAt: "asc" }] }),
    db.vendor.findMany({ where: { eventId: id }, orderBy: { name: "asc" } }),
    db.giftReservation.findMany({ where: { gift: { eventId: id, kind: "CASH" } } }),
    planForEvent(event),
  ]);
  const cur = event.currency;
  const estimated = items.reduce((s, i) => s + i.estimated, 0);
  const contracted = items.reduce((s, i) => s + (i.contracted ?? i.estimated), 0);
  const paid = items.flatMap((i) => i.payments).filter((p) => p.paidAt).reduce((s, p) => s + p.amount, 0);
  const contributions = gifts.reduce((s, r) => s + (r.amount ?? 0), 0);
  const upcoming = items.flatMap((i) => i.payments.filter((p) => !p.paidAt && p.dueAt).map((p) => ({ ...p, item: i }))).sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime()).slice(0, 5);
  const byCategory = new Map<string, typeof items>();
  for (const i of items) byCategory.set(i.category, [...(byCategory.get(i.category) ?? []), i]);

  return (
    <>
      <FlashFromSearch {...sp} />
      {!plan.canPlan && (
        <div className="mb-6"><Alert kind="info">O planeamento (tarefas, orçamento e fornecedores) fica disponível depois de <Link href={`/dashboard/events/${id}/activate`} className="font-semibold underline">ativar o evento</Link>. Até lá pode consultar o que já existe.</Alert></div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Estimado" value={formatMoney(estimated, cur)} />
        <StatCard label="Contratado" value={formatMoney(contracted, cur)} tone={contracted > estimated && estimated > 0 ? "warn" : "default"} />
        <StatCard label="Pago" value={formatMoney(paid, cur)} tone="good" />
        <StatCard label="Por pagar" value={formatMoney(Math.max(contracted - paid, 0), cur)} tone="bad" />
      </div>
      {contributions > 0 && <p className="mt-3 text-sm text-[#8c7b87]">Contribuições recebidas na lista de presentes: <strong className="text-emerald-800">{formatMoney(contributions, cur)}</strong>.</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          {plan.canPlan && (
          <details className="card" open={items.length === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-brand-800"><span>Novo item</span><span className="icon-circle h-8 w-8 bg-brand-100 text-brand-700"><Plus className="h-4 w-4" aria-hidden /></span></summary>
            <form action={addBudgetItemAction.bind(null, id)} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Categoria</label><select name="category" className="input">{BUDGET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><label className="label">Fornecedor</label><select name="vendorId" className="input"><option value="">—</option>{vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
            </div>
            <div><label className="label">Item</label><input name="name" className="input" required placeholder="Aluguer do espaço, menu por pessoa…" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Estimado ({cur})</label><input name="estimated" className="input" inputMode="decimal" placeholder="3000" /></div>
              <div><label className="label">Contratado ({cur})</label><input name="contracted" className="input" inputMode="decimal" placeholder="quando fechar" /></div>
            </div>
            <SubmitButton className="btn-primary w-full" pendingText="A adicionar…">Adicionar</SubmitButton>
          </form>
          </details>
          )}
          {upcoming.length > 0 && (
            <div className="card">
              <h2 className="font-semibold">Próximos pagamentos</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {upcoming.map((p) => {
                  const days = calendarDaysUntil(p.dueAt!, event.timezone);
                  return (
                    <li key={p.id} className="flex justify-between gap-2">
                      <span className="truncate">{p.item.name}{p.label ? ` · ${p.label}` : ""}</span>
                      <span className={days < 0 ? "font-semibold text-red-700" : days <= 7 ? "text-amber-800" : "text-[#8c7b87]"}>{formatMoney(p.amount, cur)} · {formatEventDate(p.dueAt!, false, event.timezone)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {items.length === 0 && <p className="card text-sm text-[#8c7b87]">Comece por estimar as grandes rubricas (local, catering, fotografia). Quando contratar um fornecedor no separador Fornecedores, o valor entra aqui automaticamente.</p>}
          {[...byCategory.entries()].map(([cat, list]) => {
            const catEst = list.reduce((s, i) => s + i.estimated, 0);
            const catCon = list.reduce((s, i) => s + (i.contracted ?? i.estimated), 0);
            return (
              <div key={cat} className="card">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-semibold">{cat}</h2>
                  <span className="text-xs text-[#8c7b87]">estimado {formatMoney(catEst, cur)} · contratado {formatMoney(catCon, cur)}</span>
                </div>
                <ul className="mt-3 divide-y divide-brand-100">
                  {list.map((i) => {
                    const itemPaid = i.payments.filter((p) => p.paidAt).reduce((s, p) => s + p.amount, 0);
                    const total = i.contracted ?? i.estimated;
                    return (
                      <li key={i.id} className="py-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{i.name}{i.vendor && <span className="ml-2 text-xs text-[#8c7b87]">· {i.vendor.name}</span>}</p>
                            <p className="text-xs text-[#8c7b87]">pago {formatMoney(itemPaid, cur)} de {formatMoney(total, cur)}</p>
                            <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-brand-100"><div className="h-full bg-brand-600" style={{ width: `${total ? Math.min(100, (itemPaid / total) * 100) : 0}%` }} /></div>
                          </div>
                          <form action={updateBudgetItemAction.bind(null, id, i.id)} className="flex items-center gap-1 text-xs">
                            <input name="estimated" className="input w-24 py-1 text-xs" inputMode="decimal" defaultValue={i.estimated} title="Estimado" />
                            <input name="contracted" className="input w-24 py-1 text-xs" inputMode="decimal" defaultValue={i.contracted ?? ""} placeholder="Contratado" title="Contratado" />
                            <button className="btn-secondary btn-sm">Guardar</button>
                          </form>
                        </div>
                        {i.payments.length > 0 && (
                          <ul className="mt-2 space-y-1 text-xs">
                            {i.payments.map((p) => (
                              <li key={p.id} className="flex items-center gap-2">
                                <form action={togglePaymentAction.bind(null, id, p.id)}><button className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${p.paidAt ? "border-emerald-600 bg-emerald-600 text-white" : "border-brand-300"}`} aria-label="Marcar pago">{p.paidAt ? <Check className="h-3 w-3" aria-hidden /> : null}</button></form>
                                <span className={p.paidAt ? "text-[#a1939c] line-through" : ""}>{p.label ?? "Pagamento"} · {formatMoney(p.amount, cur)}{p.dueAt ? ` · ${formatEventDate(p.dueAt, false, event.timezone)}` : ""}</span>
                                <form action={deletePaymentAction.bind(null, id, p.id)}><ConfirmButton className="text-[#a1939c] hover:text-red-700" message={`Remover o pagamento de ${formatMoney(p.amount, cur)}?`}><X className="h-3 w-3" aria-label="Remover pagamento" /></ConfirmButton></form>
                              </li>
                            ))}
                          </ul>
                        )}
                        {plan.canPlan && (
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer text-brand-700">+ pagamento</summary>
                          <form action={addPaymentAction.bind(null, id, i.id)} className="mt-2 flex flex-wrap items-end gap-2">
                            <input name="label" className="input w-28 py-1 text-xs" placeholder="Sinal" />
                            <input name="amount" className="input w-24 py-1 text-xs" inputMode="decimal" placeholder="Valor" required />
                            <input name="dueAt" type="date" className="input w-36 py-1 text-xs" />
                            <label className="flex items-center gap-1"><input type="checkbox" name="paid" /> já pago</label>
                            <SubmitButton className="btn-secondary btn-sm" pendingText="A registar…">Registar</SubmitButton>
                          </form>
                        </details>
                        )}
                        <form action={deleteBudgetItemAction.bind(null, id, i.id)} className="mt-1 text-right"><ConfirmButton className="text-xs text-[#a1939c] hover:text-red-700" message={`Remover "${i.name}"${i.payments.length ? ` e os seus ${i.payments.length} pagamento(s)` : ""}?`}>remover item</ConfirmButton></form>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
