import { db } from "@/lib/db";
import { requireEventAccess } from "@/lib/access";
import { popSecret } from "@/lib/one-time";
import { appUrl } from "@/lib/urls";
import { matchesGuestQuery } from "@/lib/checkin";
import { checkinAction, toggleCheckinAction } from "@/app/dashboard/actions";
import { createReceptionLinkAction, revokeReceptionLinkAction } from "@/app/dashboard/reception-actions";
import { FlashFromSearch, StatCard } from "@/components/ui";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { SubmitButton } from "@/components/dashboard/SubmitButton";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { CheckinForm } from "./CheckinForm";
import { CheckCircle2, KeyRound, Link2, MessageCircle } from "lucide-react";

export default async function CheckinPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string; q?: string; pin?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { event, role } = await requireEventAccess(id, { allowStaff: true });
  const guests = await db.guest.findMany({ where: { eventId: id }, orderBy: { name: "asc" } });
  const list = guests.filter((g) => matchesGuestQuery(g, sp.q ?? ""));
  const accepted = guests.filter((g) => g.rsvpStatus === "ACCEPTED" && !g.suspendedAt);
  const arrived = guests.filter((g) => g.checkedInAt);
  const expected = accepted.reduce((s, g) => s + 1 + g.companions, 0);
  const receptionUrl = event.checkinToken ? `${appUrl()}/r/${event.checkinToken}` : null;
  // O PIN só é mostrado logo a seguir à criação (identificador de uso único; o PIN nunca vai no URL).
  const freshPin = receptionUrl ? popSecret(sp.pin) : null;
  const whatsappText = receptionUrl ? `Receção de "${event.title}": abre ${receptionUrl} e introduz o PIN que te vou enviar à parte.` : "";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Confirmados" value={accepted.length} />
        <StatCard label="Pessoas esperadas" value={expected} />
        <StatCard label="Já entraram" value={arrived.length} tone="good" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <div className="card space-y-4">
            <h2 className="font-semibold">Validar entrada</h2>
            <p className="text-sm text-stone-500">Leia o QR do convite ou escreva o código de 6 caracteres que aparece no convite do convidado.</p>
            <FlashFromSearch {...sp} />
            <CheckinForm action={checkinAction.bind(null, id)} />
          </div>
          {role !== "STAFF" && (
            <div className="card space-y-3">
              <div className="flex items-center gap-3">
                <span className="icon-circle bg-brand-100 text-brand-700"><KeyRound className="h-5 w-5" strokeWidth={1.75} aria-hidden /></span>
                <h2 className="font-semibold">Acesso para a receção</h2>
              </div>
              <p className="text-sm text-muted">Quem faz a receção no dia não precisa de conta: partilhe este link e o PIN de 4 dígitos. A página permite ler QR, registar entradas e ver os pedidos dos convidados.</p>
              {receptionUrl ? (
                <>
                  <div className="rounded-2xl bg-brand-50 p-3 text-sm">
                    <p className="flex items-center gap-2 break-all font-mono text-xs text-brand-800"><Link2 className="h-4 w-4 flex-none" strokeWidth={1.75} aria-hidden />{receptionUrl}</p>
                    {freshPin ? (
                      <p className="mt-2">PIN: <span className="font-mono text-lg font-bold tracking-[0.3em] text-brand-700">{freshPin}</span> <span className="text-xs text-muted">(guarde-o: não voltará a ser mostrado)</span></p>
                    ) : (
                      <p className="mt-2 text-xs text-muted">PIN definido; gere um novo link se o perdeu.</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CopyButton text={receptionUrl} />
                    <a href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noreferrer" className="btn-secondary btn-sm"><MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />WhatsApp</a>
                    <form action={createReceptionLinkAction.bind(null, id)}>
                      <ConfirmButton className="btn-ghost btn-sm" message="Gerar um novo link e PIN? O link atual deixa de funcionar de imediato.">Gerar novo</ConfirmButton>
                    </form>
                    <form action={revokeReceptionLinkAction.bind(null, id)}>
                      <ConfirmButton className="btn-danger btn-sm" message="Revogar o acesso da receção? Quem tem o link deixa de conseguir entrar.">Revogar</ConfirmButton>
                    </form>
                  </div>
                  <p className="hint">Envie o PIN por outro canal (chamada ou SMS), não junto com o link.</p>
                </>
              ) : (
                <form action={createReceptionLinkAction.bind(null, id)}>
                  <SubmitButton className="btn-primary" pendingText="A criar…"><KeyRound className="h-4 w-4" strokeWidth={1.75} aria-hidden />Criar link de receção</SubmitButton>
                </form>
              )}
            </div>
          )}
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Lista de convidados</h2>
            <form><input name="q" className="input w-44" placeholder="Nome ou código" aria-label="Pesquisar convidado" defaultValue={sp.q ?? ""} /></form>
          </div>
          <ul className="mt-3 divide-y divide-stone-100 text-sm">
            {list.map((g) => (
              <li key={g.id} className="flex items-center justify-between py-2">
                <div>
                  <span className={g.checkedInAt ? "inline-flex items-center gap-1 font-medium text-emerald-700" : "font-medium"}>{g.checkedInAt ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : null}{g.name}</span>
                  <span className="ml-2 font-mono text-xs text-stone-400">{g.checkinCode}</span>
                  <span className="ml-2 text-xs text-stone-500">
                    {g.suspendedAt ? "suspenso" : g.rsvpStatus === "ACCEPTED" ? `confirmado${g.companions ? ` +${g.companions}` : ""}` : g.rsvpStatus === "DECLINED" ? "não vinha" : "sem resposta"}
                    {g.tableNumber ? ` · mesa ${g.tableNumber}` : ""}
                  </span>
                </div>
                <form action={toggleCheckinAction.bind(null, g.id)}>
                  <button className={g.checkedInAt ? "btn-ghost btn-sm" : "btn-secondary btn-sm"}>{g.checkedInAt ? "Anular" : "Entrou"}</button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
