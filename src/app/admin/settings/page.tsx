import { requireAdmin } from "@/lib/admin";
import { getPlatformSettings } from "@/lib/platform";
import { formatMoney } from "@/lib/format";
import { updatePlatformSettingsAction } from "@/app/admin/actions";
import { Alert, FlashFromSearch, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/dashboard/SubmitButton";

export const metadata = { title: "Definições · Administração" };

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const s = await getPlatformSettings();
  const required = s.eventPrice > 0;

  return (
    <>
      <PageHeader title="Definições" subtitle="Preço de ativação, dados bancários e o que fica disponível no plano gratuito." />
      <FlashFromSearch ok={sp.ok} error={sp.error} />
      <div className="mb-6">
        <Alert kind={required ? "info" : "success"}>
          {required
            ? <>Ativação exigida: cada evento custa <strong>{formatMoney(s.eventPrice, s.currency)}</strong>. Antes de pagar, o organizador prepara o convite e adiciona até {s.freeGuestLimit} convidados{s.gateSharing ? "; os convites só se enviam (e abrem) depois da ativação" : ""}{s.gatePlanner ? "; o planeamento fica bloqueado" : ""}.</>
            : <>Com preço <strong>0</strong> não é necessária ativação: todos os eventos ficam com tudo desbloqueado e a página de pagamentos não recebe pedidos.</>}
        </Alert>
      </div>

      <form action={updatePlatformSettingsAction} className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-3">
          <h2 className="font-semibold">Preço e plano gratuito</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="eventPrice">Preço por evento</label>
              <input id="eventPrice" name="eventPrice" className="input" inputMode="decimal" defaultValue={s.eventPrice} placeholder="15000" />
              <p className="hint">0 = sem ativação. Aceita 15000 ou 1.250,00.</p>
            </div>
            <div>
              <label className="label" htmlFor="currency">Moeda</label>
              <input id="currency" name="currency" className="input uppercase" defaultValue={s.currency} maxLength={3} placeholder="AOA" />
              <p className="hint">Código ISO de 3 letras (AOA, EUR, USD).</p>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="freeGuestLimit">Convidados no plano gratuito</label>
            <input id="freeGuestLimit" name="freeGuestLimit" type="number" min={0} max={10000} className="input" defaultValue={s.freeGuestLimit} />
            <p className="hint">Quantos convidados se podem adicionar antes da ativação (para testar o convite).</p>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="gateSharing" defaultChecked={s.gateSharing} className="mt-1" />
            <span><span className="font-medium">Bloquear envio dos convites antes da ativação</span><span className="block text-xs text-muted">Os botões WhatsApp/SMS/link ficam desativados e os convidados não conseguem abrir o convite.</span></span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="gatePlanner" defaultChecked={s.gatePlanner} className="mt-1" />
            <span><span className="font-medium">Bloquear planeamento antes da ativação</span><span className="block text-xs text-muted">Tarefas, orçamento e fornecedores ficam só de leitura até ativar.</span></span>
          </label>
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold">Dados para a transferência</h2>
          <p className="text-xs text-muted">Mostrados ao organizador na página de ativação, junto com a referência única do pedido.</p>
          <div>
            <label className="label" htmlFor="bankName">Banco</label>
            <input id="bankName" name="bankName" className="input" defaultValue={s.bankName ?? ""} placeholder="Banco Angolano de Investimentos" />
          </div>
          <div>
            <label className="label" htmlFor="bankAccount">IBAN / número de conta</label>
            <input id="bankAccount" name="bankAccount" className="input font-mono" defaultValue={s.bankAccount ?? ""} placeholder="AO06 0000 0000 0000 0000 0000 0" />
          </div>
          <div>
            <label className="label" htmlFor="bankHolder">Titular</label>
            <input id="bankHolder" name="bankHolder" className="input" defaultValue={s.bankHolder ?? ""} placeholder="Liplip, Lda." />
          </div>
          <div>
            <label className="label" htmlFor="paymentNote">Instruções de pagamento</label>
            <textarea id="paymentNote" name="paymentNote" className="input" rows={4} defaultValue={s.paymentNote ?? ""} placeholder="Ex.: Indique a referência no descritivo da transferência. Aprovamos em até 24 horas úteis." />
          </div>
        </div>

        <div className="lg:col-span-2"><SubmitButton pendingText="A guardar…">Guardar definições</SubmitButton></div>
      </form>
    </>
  );
}
