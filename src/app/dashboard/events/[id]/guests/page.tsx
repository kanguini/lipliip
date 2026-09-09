import Link from "next/link";
import { db } from "@/lib/db";
import { requireOwnedEvent } from "@/lib/auth";
import { formatPhone, phoneForWhatsApp } from "@/lib/phone";
import { formatEventDate } from "@/lib/format";
import { inviteShareMessage, inviteUrl } from "@/lib/urls";
import { addGuestAction, importGuestsAction, markSentAction, sendSmsInviteAction } from "@/app/dashboard/actions";
import { FlashFromSearch, RsvpBadge } from "@/components/ui";
import { CopyButton } from "@/components/dashboard/CopyButton";

export default async function GuestsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string; q?: string; status?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { event } = await requireOwnedEvent(id);
  const guests = await db.guest.findMany({ where: { eventId: id }, orderBy: [{ groupName: "asc" }, { name: "asc" }] });
  const q = (sp.q ?? "").toLowerCase();
  const filtered = guests.filter((g) => (!q || g.name.toLowerCase().includes(q) || g.phone.includes(q) || (g.groupName ?? "").toLowerCase().includes(q)) && (!sp.status || g.rsvpStatus === sp.status));
  const returnTo = `/dashboard/events/${id}/guests`;
  const pendingSent = guests.filter((g) => g.rsvpStatus === "PENDING" && g.sentAt);
  const reminderText = (g: (typeof guests)[number]) =>
    `Olá ${g.name.split(" ")[0]}! Ainda não recebemos a tua confirmação para "${event.title}"${event.rsvpDeadline ? ` (prazo: ${formatEventDate(event.rsvpDeadline, false, event.timezone)})` : ""}. Podes confirmar no teu convite: ${inviteUrl(g.token)} 🙏`;

  return (
    <>
      <FlashFromSearch {...sp} />
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <form action={addGuestAction.bind(null, id)} className="card space-y-3">
            <h2 className="font-semibold">Adicionar convidado</h2>
            <div>
              <label className="label">Nome</label>
              <input name="name" className="input" required placeholder="Ana Silva" />
            </div>
            <div>
              <label className="label">Telemóvel</label>
              <input name="phone" className="input" required placeholder="912 345 678 ou +244 923 456 789" />
              <p className="hint">É para este número que será enviado o código de validação.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Acompanhantes permitidos</label>
                <input name="maxCompanions" type="number" min={0} max={20} className="input" defaultValue={0} />
              </div>
              <div>
                <label className="label">Grupo</label>
                <input name="groupName" className="input" placeholder="Família, Amigos…" list="groups" />
                <datalist id="groups">
                  {[...new Set(guests.map((g) => g.groupName).filter(Boolean))].map((g) => <option key={g!} value={g!} />)}
                </datalist>
              </div>
              <div>
                <label className="label">Mesa (opcional)</label>
                <input name="tableNumber" className="input" placeholder="12" />
              </div>
              <div>
                <label className="label">Email (opcional)</label>
                <input name="email" type="email" className="input" />
              </div>
            </div>
            <button className="btn-primary w-full">Adicionar</button>
          </form>

          <form action={importGuestsAction.bind(null, id)} className="card space-y-3">
            <h2 className="font-semibold">Importar lista</h2>
            <p className="text-xs text-stone-500">Cole uma linha por convidado: <code>Nome; Telefone; Acompanhantes; Grupo</code>. Pode copiar diretamente do Excel.</p>
            <textarea name="text" className="input font-mono text-xs" rows={6} placeholder={"Ana Silva; 912345678; 1; Família\nRui Costa; +244923456789; 0; Trabalho"} required />
            <button className="btn-secondary w-full">Importar</button>
          </form>
        </div>

        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">{guests.length} convidados</h2>
            <div className="flex flex-wrap gap-2">
            <a href={`/dashboard/events/${id}/guests/export.csv`} className="btn-secondary btn-sm">⬇ Exportar Excel/CSV</a>
            <form className="flex gap-2">
              <input name="q" className="input w-40" placeholder="Pesquisar" aria-label="Pesquisar convidados" defaultValue={sp.q ?? ""} />
              <select name="status" className="input w-36" defaultValue={sp.status ?? ""}>
                <option value="">Todos</option>
                <option value="ACCEPTED">Confirmados</option>
                <option value="DECLINED">Não vão</option>
                <option value="PENDING">Sem resposta</option>
              </select>
              <button className="btn-secondary btn-sm">Filtrar</button>
            </form>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="mt-6 text-center text-sm text-stone-500">Nenhum convidado{q || sp.status ? " corresponde ao filtro" : " ainda"}.</p>
          ) : (
            <ul className="mt-4 divide-y divide-stone-100">
              {filtered.map((g) => {
                const url = inviteUrl(g.token);
                const message = inviteShareMessage({ guestName: g.name.split(" ")[0], hostNames: event.hostNames, eventTitle: event.title, url });
                const wa = `https://wa.me/${phoneForWhatsApp(g.phone)}?text=${encodeURIComponent(message)}`;
                return (
                  <li key={g.id} className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link href={`/dashboard/events/${id}/guests/${g.id}`} className="font-medium hover:underline">{g.name}</Link>
                        <span className="ml-2 text-xs text-stone-500">{formatPhone(g.phone)}</span>
                        {g.groupName && <span className="badge ml-2 bg-stone-100 text-stone-600">{g.groupName}</span>}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                          <RsvpBadge status={g.rsvpStatus} />
                          {g.rsvpStatus === "ACCEPTED" && g.maxCompanions > 0 && <span>+{g.companions} de {g.maxCompanions}</span>}
                          <span>{g.sentAt ? `enviado (${g.sentVia ?? "?"})` : "não enviado"}</span>
                          <span>· {g.firstOpenedAt ? `aberto ${g.openCount}×` : "não aberto"}</span>
                          {g.verifiedAt && <span>· ✓ telemóvel validado</span>}
                          {g.checkedInAt && <span>· 🎟 entrou</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <a href={wa} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">WhatsApp</a>
                        <form action={sendSmsInviteAction.bind(null, g.id)}><button className="btn-secondary btn-sm">SMS</button></form>
                        <CopyButton text={url} />
                        {!g.sentAt && (
                          <form action={markSentAction.bind(null, g.id, "manual", returnTo)}><button className="btn-ghost btn-sm" title="Marcar como enviado">✓ enviado</button></form>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {pendingSent.length > 0 && (
            <details className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-amber-900">🔔 Lembretes: {pendingSent.length} convidado(s) receberam o convite e ainda não responderam</summary>
              <ul className="mt-3 space-y-2 text-sm">
                {pendingSent.map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-2">
                    <span>{g.name}{g.firstOpenedAt ? <span className="text-xs text-stone-500"> · abriu {g.openCount}×</span> : <span className="text-xs text-stone-500"> · nunca abriu</span>}</span>
                    <a href={`https://wa.me/${phoneForWhatsApp(g.phone)}?text=${encodeURIComponent(reminderText(g))}`} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">Lembrar por WhatsApp</a>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <p className="mt-4 text-xs text-stone-500">
            Dica: o botão WhatsApp abre a conversa com a mensagem e o link pessoal já escritos. Depois de enviar, marque como enviado. O link só abre depois de o convidado validar o telemóvel.
          </p>
        </div>
      </div>
    </>
  );
}
