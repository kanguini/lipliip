import Link from "next/link";
import { db } from "@/lib/db";
import { requireEventAccess } from "@/lib/access";
import { getPlatformSettings, eventPlan } from "@/lib/platform";
import { formatDateTimeShort, formatMoney } from "@/lib/format";
import { activationState, ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from "@/lib/activation";
import { mediaUrl } from "@/lib/media";
import { submitActivationProofAction } from "@/app/dashboard/activation-actions";
import { Alert, FlashFromSearch } from "@/components/ui";
import { SubmitButton } from "@/components/dashboard/SubmitButton";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { BadgeCheck, Building2, FileText, Landmark, ListChecks, Send, Users } from "lucide-react";

export const metadata = { title: "Ativação do evento" };

export default async function ActivatePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { event, user } = await requireEventAccess(id);
  const [settings, orders] = await Promise.all([
    getPlatformSettings(),
    db.order.findMany({ where: { eventId: id }, orderBy: { createdAt: "desc" }, select: { id: true, userId: true, status: true, reference: true, amount: true, currency: true, createdAt: true, reviewedAt: true, adminNote: true, note: true, proofMediaId: true } }),
  ]);
  const plan = eventPlan(event, settings);
  const pending = orders.find((o) => o.status === "PENDING") ?? null;
  const state = activationState(plan, orders[0] ?? null);
  const tz = event.timezone;

  const unlocked = (
    <ul className="mt-3 space-y-2 text-sm">
      <li className="flex items-center gap-2"><Send className="h-4 w-4 text-brand-600" strokeWidth={1.75} aria-hidden />Envio dos convites por WhatsApp, SMS ou link pessoal; os convidados podem abri-los.</li>
      <li className="flex items-center gap-2"><Users className="h-4 w-4 text-brand-600" strokeWidth={1.75} aria-hidden />Convidados sem limite.</li>
      <li className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-brand-600" strokeWidth={1.75} aria-hidden />Tarefas, orçamento, fornecedores e todos os templates, incluindo os Premium.</li>
    </ul>
  );

  return (
    <>
      <FlashFromSearch {...sp} />

      {state === "NOT_REQUIRED" && (
        <div className="card">
          <span className="icon-circle bg-joy-sage/40 text-brand-700"><BadgeCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden /></span>
          <h2 className="font-display mt-4 text-2xl">Não é necessária ativação.</h2>
          <p className="mt-1 text-sm text-muted">Neste momento a plataforma não cobra pela ativação dos eventos: pode enviar os convites e usar todas as funcionalidades.</p>
          {unlocked}
        </div>
      )}

      {state === "ACTIVE" && (
        <div className="card">
          <span className="icon-circle bg-joy-sage/40 text-brand-700"><BadgeCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden /></span>
          <h2 className="font-display mt-4 text-2xl">Evento ativado{event.activatedAt ? ` em ${formatDateTimeShort(event.activatedAt, tz)}` : ""}.</h2>
          <p className="mt-1 text-sm text-muted">Está tudo desbloqueado:</p>
          {unlocked}
          <div className="mt-4"><Link href={`/dashboard/events/${id}/guests`} className="btn-primary btn-sm">Enviar os convites</Link></div>
        </div>
      )}

      {(state === "PENDING" || state === "REJECTED" || state === "NOT_REQUESTED") && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            <div className="card">
              <p className="eyebrow">Ativação do evento</p>
              <h2 className="font-display mt-2 text-3xl">{formatMoney(plan.price, plan.currency)}<span className="text-base text-muted"> · pagamento único</span></h2>
              <p className="mt-2 text-sm text-muted">Enquanto o evento não está ativado pode preparar tudo com calma e adicionar até {settings.freeGuestLimit} convidados para testar. Ao ativar fica disponível:</p>
              {unlocked}
            </div>

            <div className="card">
              <h2 className="flex items-center gap-2 font-semibold"><Landmark className="h-4 w-4 text-brand-600" strokeWidth={1.75} aria-hidden />Dados para a transferência</h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-muted">Banco</dt><dd className="font-medium">{settings.bankName ?? "—"}</dd></div>
                <div><dt className="text-xs text-muted">Titular</dt><dd className="font-medium">{settings.bankHolder ?? "—"}</dd></div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted">IBAN / conta</dt>
                  <dd className="flex flex-wrap items-center gap-2 font-mono text-sm">{settings.bankAccount ?? "—"}{settings.bankAccount && <CopyButton text={settings.bankAccount} label="Copiar" className="btn-ghost btn-sm" />}</dd>
                </div>
                <div><dt className="text-xs text-muted">Valor</dt><dd className="font-medium">{formatMoney(plan.price, plan.currency)}</dd></div>
                <div>
                  <dt className="text-xs text-muted">Referência a indicar</dt>
                  <dd className="flex flex-wrap items-center gap-2 font-mono text-sm">{pending ? <>{pending.reference}<CopyButton text={pending.reference} label="Copiar" className="btn-ghost btn-sm" /></> : <span className="text-muted">gerada ao enviar o comprovativo</span>}</dd>
                </div>
              </dl>
              {settings.paymentNote && <p className="mt-4 whitespace-pre-line rounded-2xl bg-brand-50 p-3 text-sm text-brand-900">{settings.paymentNote}</p>}
              <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-muted">
                <li>Faça a transferência do valor indicado para a conta acima{pending ? `, com a referência ${pending.reference} no descritivo` : ""}.</li>
                <li>Envie aqui o comprovativo (PDF ou fotografia).</li>
                <li>Confirmamos o pagamento e ativamos o evento; recebe a confirmação nesta página.</li>
              </ol>
            </div>
          </div>

          <div className="space-y-6">
            {state === "PENDING" && pending && (
              <Alert kind="info">
                Comprovativo em análise desde {formatDateTimeShort(pending.createdAt, tz)} (referência <strong>{pending.reference}</strong>). Se enviou o comprovativo errado, pode substituí-lo abaixo.
              </Alert>
            )}
            {state === "REJECTED" && orders[0] && (
              <Alert kind="error">
                O último pedido foi rejeitado{orders[0].adminNote ? `: ${orders[0].adminNote}` : "."} Pode enviar um novo comprovativo.
              </Alert>
            )}
            <form action={submitActivationProofAction.bind(null, id)} className="card space-y-3" encType="multipart/form-data">
              <h2 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4 text-brand-600" strokeWidth={1.75} aria-hidden />{pending ? "Substituir o comprovativo" : "Enviar o comprovativo"}</h2>
              <div>
                <label className="label" htmlFor="proof">Comprovativo (PDF ou imagem, até 12 MB)</label>
                <input id="proof" name="proof" type="file" accept="image/*,application/pdf" className="input file:mr-3 file:rounded-full file:border-0 file:bg-brand-100 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-brand-700" required />
              </div>
              <div>
                <label className="label" htmlFor="note">Nota (opcional)</label>
                <textarea id="note" name="note" className="input" rows={2} placeholder="Ex.: transferência feita em nome de outra pessoa" defaultValue={pending?.note ?? ""} />
              </div>
              <SubmitButton className="btn-primary w-full" pendingText="A enviar…">{pending ? "Substituir comprovativo" : "Enviar comprovativo"}</SubmitButton>
            </form>
          </div>
        </div>
      )}

      {orders.length > 0 && (
        <div className="card mt-6">
          <h2 className="flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4 text-brand-600" strokeWidth={1.75} aria-hidden />Pedidos de ativação</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr><th className="py-2 pr-3 font-medium">Data</th><th className="py-2 pr-3 font-medium">Referência</th><th className="py-2 pr-3 font-medium">Valor</th><th className="py-2 pr-3 font-medium">Estado</th><th className="py-2 pr-3 font-medium">Comprovativo</th></tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDateTimeShort(o.createdAt, tz)}</td>
                    <td className="py-2 pr-3 font-mono">{o.reference}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatMoney(o.amount, o.currency)}</td>
                    <td className="py-2 pr-3">
                      <span className={`badge ${ORDER_STATUS_STYLE[o.status] ?? ORDER_STATUS_STYLE.PENDING}`}>{ORDER_STATUS_LABEL[o.status] ?? o.status}</span>
                      {o.status === "REJECTED" && o.adminNote && <p className="mt-1 text-xs text-red-800">{o.adminNote}</p>}
                      {o.reviewedAt && <p className="mt-1 text-xs text-muted">revisto {formatDateTimeShort(o.reviewedAt, tz)}</p>}
                    </td>
                    {/* O comprovativo só sai para quem o enviou (ou para a administração): ver /media/[id]. */}
                    <td className="py-2 pr-3">{o.proofMediaId && o.userId === user.id ? <a href={mediaUrl(o.proofMediaId)} target="_blank" rel="noreferrer" className="underline">ver</a> : <span className="text-muted">{o.proofMediaId ? "enviado" : "—"}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
