import { db } from "@/lib/db";
import { requireOwnedEvent } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { addGiftAction, deleteGiftAction } from "@/app/dashboard/actions";
import { FlashFromSearch } from "@/components/ui";
import { Gift, HeartHandshake, Plus } from "lucide-react";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { SubmitButton } from "@/components/dashboard/SubmitButton";

export default async function GiftsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { event } = await requireOwnedEvent(id);
  const gifts = await db.giftItem.findMany({ where: { eventId: id }, include: { reservations: { include: { guest: { select: { name: true } } } } }, orderBy: { createdAt: "asc" } });
  const totalCash = gifts.flatMap((g) => g.reservations).reduce((s, r) => s + (r.amount ?? 0), 0);

  return (
    <>
      <FlashFromSearch {...sp} />
      {!event.giftsEnabled && <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">A lista de presentes está desativada nas definições: os convidados não a veem.</p>}
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <details className="card" open={gifts.length === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-brand-800"><span>Adicionar presente</span><span className="icon-circle h-8 w-8 bg-brand-100 text-brand-700"><Plus className="h-4 w-4" aria-hidden /></span></summary>
          <form action={addGiftAction.bind(null, id)} className="mt-4 space-y-3">
          <div>
            <label className="label" htmlFor="gi-kind">Tipo</label>
            <select id="gi-kind" name="kind" className="input">
              <option value="PRODUCT">Produto (reservável)</option>
              <option value="CASH">Contribuição em dinheiro (ex: lua de mel)</option>
            </select>
          </div>
          <div><label className="label" htmlFor="gi-name">Nome</label><input id="gi-name" name="name" className="input" required placeholder="Máquina de café" /></div>
          <div><label className="label" htmlFor="gi-description">Descrição</label><input id="gi-description" name="description" className="input" placeholder="Modelo, cor, loja…" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="gi-price">Preço ({event.currency})</label><input id="gi-price" name="price" className="input" inputMode="decimal" placeholder="89,90" /></div>
            <div><label className="label" htmlFor="gi-quantity">Quantidade</label><input id="gi-quantity" name="quantity" type="number" min={1} className="input" defaultValue={1} /></div>
          </div>
          <div><label className="label" htmlFor="gi-storeUrl">Link da loja</label><input id="gi-storeUrl" name="storeUrl" type="url" className="input" placeholder="https://…" /></div>
          <div><label className="label" htmlFor="gi-imageUrl">Imagem (URL)</label><input id="gi-imageUrl" name="imageUrl" type="url" className="input" placeholder="https://…/foto.jpg" /></div>
          <SubmitButton className="btn-primary w-full" pendingText="A adicionar…">Adicionar</SubmitButton>
        </form>
        </details>

        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{gifts.length} presentes</h2>
            {totalCash > 0 && <span className="text-sm text-emerald-700">Contribuições: {formatMoney(totalCash, event.currency)}</span>}
          </div>
          {gifts.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted">Ainda não adicionou presentes. Se preferir só contribuições por IBAN, Multicaixa Express ou MB WAY, preencha-as nas Definições.</p>
          ) : (
            <ul className="mt-4 divide-y divide-stone-100">
              {gifts.map((g) => {
                const reserved = g.reservations.reduce((s, r) => s + r.quantity, 0);
                return (
                  <li key={g.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="text-sm">
                      <p className="flex items-center gap-2 font-medium">{g.kind === "CASH" ? <HeartHandshake className="h-4 w-4 text-brand-600" aria-hidden /> : <Gift className="h-4 w-4 text-brand-600" aria-hidden />}{g.name}{g.price != null && <span className="ml-2 text-muted">{formatMoney(g.price, event.currency)}</span>}</p>
                      {g.description && <p className="text-muted">{g.description}</p>}
                      {g.kind === "CASH" ? (
                        <p className="text-xs text-stone-600">
                          {g.reservations.length} contribuições
                          {g.reservations.length > 0 && `: ${g.reservations.map((r) => `${r.guest.name} (${formatMoney(r.amount ?? 0, event.currency)})`).join(", ")}`}
                        </p>
                      ) : (
                        <p className="text-xs text-stone-600">
                          {reserved}/{g.quantity} reservado{g.reservations.length > 0 && ` por ${g.reservations.map((r) => r.guest.name).join(", ")}`}
                        </p>
                      )}
                    </div>
                    <form action={deleteGiftAction.bind(null, g.id)}><ConfirmButton message={g.reservations.length > 0 ? `"${g.name}" já tem reservas. Remover mesmo assim?` : `Remover "${g.name}"?`}>Remover</ConfirmButton></form>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
