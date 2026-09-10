import Link from "next/link";
import { db } from "@/lib/db";
import { requireEventAccess } from "@/lib/access";
import { formatMoney } from "@/lib/format";
import { BUDGET_CATEGORIES, VENDOR_STATUS } from "@/lib/checklists";
import { addVendorAction, deleteVendorAction, updateVendorAction } from "@/app/dashboard/planner-actions";
import { planForEvent } from "@/lib/platform";
import { Alert, FlashFromSearch } from "@/components/ui";
import { ArrowUpRight, Plus } from "lucide-react";
import { SubmitButton } from "@/components/dashboard/SubmitButton";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";

const STATUS_STYLE: Record<string, string> = {
  CONTACTING: "bg-[#f8f0de] text-[#8b6b2d]",
  PROPOSAL: "bg-[#e6eef8] text-[#2f4f7a]",
  HIRED: "bg-[#e9f2eb] text-[#416c4a]",
  REJECTED: "bg-[#eeeaee] text-[#6d5e69]",
};

export default async function VendorsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { event } = await requireEventAccess(id);
  const [vendors, plan] = await Promise.all([db.vendor.findMany({ where: { eventId: id }, orderBy: [{ category: "asc" }, { createdAt: "asc" }] }), planForEvent(event)]);
  const byCategory = new Map<string, typeof vendors>();
  for (const v of vendors) byCategory.set(v.category, [...(byCategory.get(v.category) ?? []), v]);

  return (
    <>
      <FlashFromSearch {...sp} />
      {!plan.canPlan && (
        <div className="mb-6"><Alert kind="info">O planeamento (tarefas, orçamento e fornecedores) fica disponível depois de <Link href={`/dashboard/events/${id}/activate`} className="font-semibold underline">ativar o evento</Link>. Até lá pode consultar o que já existe.</Alert></div>
      )}
      <div className={`grid gap-6 ${plan.canPlan ? "lg:grid-cols-[1fr_2fr]" : ""}`}>
        {plan.canPlan && (
        <details className="card" open={vendors.length === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-brand-800"><span>Novo fornecedor</span><span className="icon-circle h-8 w-8 bg-brand-100 text-brand-700"><Plus className="h-4 w-4" aria-hidden /></span></summary>
          <form action={addVendorAction.bind(null, id)} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="v-category">Categoria</label><select id="v-category" name="category" className="input">{BUDGET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label className="label" htmlFor="v-status">Estado</label><select id="v-status" name="status" className="input">{Object.entries(VENDOR_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          </div>
          <div><label className="label" htmlFor="v-name">Nome</label><input id="v-name" name="name" className="input" required placeholder="Quinta da Serra, DJ Marco…" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="v-contactName">Contacto</label><input id="v-contactName" name="contactName" className="input" placeholder="Pessoa" /></div>
            <div><label className="label" htmlFor="v-phone">Telefone</label><input id="v-phone" name="phone" className="input" inputMode="tel" /></div>
            <div><label className="label" htmlFor="v-email">Email</label><input id="v-email" name="email" type="email" className="input" /></div>
            <div><label className="label" htmlFor="v-website">Site / Instagram</label><input id="v-website" name="website" type="url" className="input" placeholder="https://" /></div>
          </div>
          <div><label className="label" htmlFor="v-price">Valor da proposta ({event.currency})</label><input id="v-price" name="price" className="input" inputMode="decimal" placeholder="2500" /></div>
          <div><label className="label" htmlFor="v-notes">Notas</label><textarea id="v-notes" name="notes" className="input" rows={2} placeholder="O que inclui, condições, impressão…" /></div>
          <SubmitButton className="btn-primary w-full" pendingText="A adicionar…">Adicionar</SubmitButton>
        </form>
        </details>
        )}

        <div className="space-y-4">
          {vendors.length === 0 && <p className="card text-sm text-muted">Registe aqui as propostas que recebe. Ao marcar um fornecedor como contratado, o valor entra automaticamente no orçamento.</p>}
          {[...byCategory.entries()].map(([cat, list]) => (
            <div key={cat} className="card">
              <h2 className="font-semibold">{cat} <span className="text-xs font-normal text-muted">· {list.length} proposta(s)</span></h2>
              <ul className="mt-3 divide-y divide-brand-100">
                {list.map((v) => (
                  <li key={v.id} className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{v.name} <span className={`badge ml-1 ${STATUS_STYLE[v.status]}`}>{VENDOR_STATUS[v.status]}</span></p>
                        <p className="mt-0.5 text-xs text-muted">
                          {[v.contactName, v.phone, v.email].filter(Boolean).join(" · ")}
                          {v.website && <> · <a href={v.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline">site<ArrowUpRight className="h-3 w-3" aria-hidden /></a></>}
                        </p>
                        {v.notes && <p className="mt-1 text-xs text-muted">{v.notes}</p>}
                      </div>
                      <p className="font-display text-xl text-brand-700">{v.price != null ? formatMoney(v.price, event.currency) : "—"}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <form action={updateVendorAction.bind(null, id, v.id)} className="flex flex-wrap items-center gap-2">
                        <select name="status" className="input w-auto py-1 text-xs" defaultValue={v.status}>{Object.entries(VENDOR_STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                        <input name="price" className="input w-28 py-1 text-xs" inputMode="decimal" defaultValue={v.price ?? ""} placeholder="Valor" />
                        <button className="btn-secondary btn-sm">Guardar</button>
                      </form>
                      <form action={deleteVendorAction.bind(null, id, v.id)}><ConfirmButton className="btn-ghost btn-sm text-red-700" message={`Remover o fornecedor ${v.name}? As linhas de orçamento criadas por ele sem pagamentos também são removidas.`}>Remover</ConfirmButton></form>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
