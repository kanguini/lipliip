import Link from "next/link";
import { db } from "@/lib/db";
import { requireOwnedEvent } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { calendarDaysUntil } from "@/lib/timezone";
import { isSmsConfigured } from "@/lib/sms";
import { FlashFromSearch, StatCard } from "@/components/ui";

export default async function EventOverviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { event } = await requireOwnedEvent(id);
  const [guests, gifts, guestbookCount, tasks, budgetItems, vendorsHired] = await Promise.all([
    db.guest.findMany({ where: { eventId: id }, orderBy: { respondedAt: "desc" } }),
    db.giftItem.findMany({ where: { eventId: id }, include: { reservations: true } }),
    db.guestbookEntry.count({ where: { eventId: id } }),
    db.task.findMany({ where: { eventId: id }, orderBy: { dueAt: "asc" } }),
    db.budgetItem.findMany({ where: { eventId: id }, include: { payments: true } }),
    db.vendor.count({ where: { eventId: id, status: "HIRED" } }),
  ]);
  const tasksDone = tasks.filter((t) => t.completedAt).length;
  const nextTasks = tasks.filter((t) => !t.completedAt).slice(0, 4);
  const budgetTotal = budgetItems.reduce((s, i) => s + (i.contracted ?? i.estimated), 0);
  const budgetPaid = budgetItems.flatMap((i) => i.payments).filter((p) => p.paidAt).reduce((s, p) => s + p.amount, 0);

  const accepted = guests.filter((g) => g.rsvpStatus === "ACCEPTED");
  const declined = guests.filter((g) => g.rsvpStatus === "DECLINED");
  const pending = guests.filter((g) => g.rsvpStatus === "PENDING");
  const sent = guests.filter((g) => g.sentAt);
  const opened = guests.filter((g) => g.firstOpenedAt);
  const people = accepted.reduce((s, g) => s + 1 + g.companions, 0);
  const reservedGifts = gifts.filter((g) => g.kind === "PRODUCT" && g.reservations.length > 0).length;
  const cash = gifts.flatMap((g) => g.reservations).reduce((s, r) => s + (r.amount ?? 0), 0);
  const days = calendarDaysUntil(event.date, event.timezone);
  const recent = guests.filter((g) => g.respondedAt).slice(0, 8);
  const songs = accepted.filter((g) => g.songRequest);
  const dietary = accepted.filter((g) => g.dietaryNotes);

  return (
    <>
      <FlashFromSearch {...sp} />
      {event.verificationRequired && !isSmsConfigured() && (
        <div className="card mb-6 border-amber-200 bg-amber-50 text-sm text-amber-900">
          <p className="font-semibold">Envio de SMS ainda não configurado</p>
          <p className="mt-1">
            A validação por SMS está ativa, mas não há fornecedor de SMS configurado: os códigos ficam apenas nos registos do servidor e os convidados não os recebem.
            Configure a Twilio (variáveis <code>SMS_PROVIDER</code>, <code>TWILIO_*</code>) ou desative a validação por SMS nas <Link href={`/dashboard/events/${id}/settings`} className="underline">Definições</Link> enquanto testa.
          </p>
        </div>
      )}
      {guests.length === 0 && (
        <div className="card mb-6 flex flex-wrap items-center justify-between gap-3 border-brand-200 bg-brand-50">
          <p className="text-sm">O evento está criado. O próximo passo é adicionar os convidados e enviar os links pessoais.</p>
          <Link href={`/dashboard/events/${id}/guests`} className="btn-primary btn-sm">Adicionar convidados</Link>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Faltam" value={days > 1 ? `${days} dias` : days === 1 ? "1 dia" : days === 0 ? "É hoje!" : "Já aconteceu"} />
        <StatCard label="Convidados" value={guests.length} />
        <StatCard label="Confirmados" value={accepted.length} tone="good" />
        <StatCard label="Pessoas previstas" value={people} tone="good" />
        <StatCard label="Não vão" value={declined.length} tone="bad" />
        <StatCard label="Sem resposta" value={pending.length} tone="warn" />
        <StatCard label="Enviados / abertos" value={`${sent.length} / ${opened.length}`} />
        <StatCard label="Presentes reservados" value={`${reservedGifts}${cash > 0 ? ` + ${formatMoney(cash, event.currency)}` : ""}`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Link href={`/dashboard/events/${id}/tasks`} className="card transition hover:shadow-md">
          <p className="eyebrow">Tarefas</p>
          <p className="font-display mt-2 text-3xl text-brand-700">{tasks.length ? Math.round((tasksDone / tasks.length) * 100) : 0}%</p>
          <p className="text-xs text-[#8c7b87]">{tasksDone} de {tasks.length} feitas</p>
          <ul className="mt-3 space-y-1 text-sm">
            {nextTasks.map((t) => <li key={t.id} className="truncate">○ {t.title}</li>)}
            {nextTasks.length === 0 && <li className="text-[#8c7b87]">Tudo feito 🎉</li>}
          </ul>
        </Link>
        <Link href={`/dashboard/events/${id}/budget`} className="card transition hover:shadow-md">
          <p className="eyebrow">Orçamento</p>
          <p className="font-display mt-2 text-3xl text-brand-700">{formatMoney(budgetTotal, event.currency)}</p>
          <p className="text-xs text-[#8c7b87]">pago {formatMoney(budgetPaid, event.currency)} · por pagar {formatMoney(Math.max(budgetTotal - budgetPaid, 0), event.currency)}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-100"><div className="h-full bg-brand-600" style={{ width: `${budgetTotal ? Math.min(100, (budgetPaid / budgetTotal) * 100) : 0}%` }} /></div>
        </Link>
        <Link href={`/dashboard/events/${id}/vendors`} className="card transition hover:shadow-md">
          <p className="eyebrow">Fornecedores</p>
          <p className="font-display mt-2 text-3xl text-brand-700">{vendorsHired}</p>
          <p className="text-xs text-[#8c7b87]">contratados</p>
          <p className="mt-3 text-sm text-[#8c7b87]">Registe propostas e compare por categoria.</p>
        </Link>
      </div>
      {(songs.length > 0 || dietary.length > 0) && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {songs.length > 0 && (
            <div className="card">
              <h2 className="font-semibold">🎶 Músicas pedidas ({songs.length})</h2>
              <ul className="mt-2 space-y-1 text-sm">{songs.map((g) => <li key={g.id}>{g.songRequest} <span className="text-xs text-stone-400">· {g.name}</span></li>)}</ul>
            </div>
          )}
          {dietary.length > 0 && (
            <div className="card">
              <h2 className="font-semibold">🥗 Restrições alimentares ({dietary.length})</h2>
              <ul className="mt-2 space-y-1 text-sm">{dietary.map((g) => <li key={g.id}>{g.name}: {g.dietaryNotes}</li>)}</ul>
            </div>
          )}
        </div>
      )}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold">Últimas respostas</h2>
          {recent.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">Ainda ninguém respondeu.</p>
          ) : (
            <ul className="mt-3 divide-y divide-stone-100 text-sm">
              {recent.map((g) => (
                <li key={g.id} className="flex items-center justify-between py-2">
                  <span>
                    <Link href={`/dashboard/events/${id}/guests/${g.id}`} className="font-medium hover:underline">{g.name}</Link>
                    {g.companions > 0 && <span className="text-stone-500"> +{g.companions}</span>}
                    {g.rsvpMessage && <span className="block text-xs italic text-stone-500">“{g.rsvpMessage}”</span>}
                  </span>
                  <span className={g.rsvpStatus === "ACCEPTED" ? "text-emerald-700" : "text-red-700"}>{g.rsvpStatus === "ACCEPTED" ? "Vai" : "Não vai"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h2 className="font-semibold">Atalhos</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="text-brand-700 hover:underline" href={`/dashboard/events/${id}/guests`}>→ Gerir convidados e enviar convites</Link></li>
            <li><Link className="text-brand-700 hover:underline" href={`/dashboard/events/${id}/content`}>→ História, galeria, padrinhos, música e informações úteis</Link></li>
            <li><Link className="text-brand-700 hover:underline" href={`/dashboard/events/${id}/tables`}>→ Plano de mesas</Link></li>
            <li><Link className="text-brand-700 hover:underline" href={`/dashboard/events/${id}/gifts`}>→ Lista de presentes ({gifts.length} itens)</Link></li>
            <li><Link className="text-brand-700 hover:underline" href={`/dashboard/events/${id}/guestbook`}>→ Livro de mensagens ({guestbookCount})</Link></li>
            <li><Link className="text-brand-700 hover:underline" href={`/dashboard/events/${id}/checkin`}>→ Check-in no dia do evento</Link></li>
            <li><Link className="text-brand-700 hover:underline" href={`/dashboard/events/${id}/design`}>→ Mudar template ou cor</Link></li>
          </ul>
          <div className="mt-4 rounded-lg bg-stone-50 p-3 text-xs text-stone-600">
            <p className="font-semibold">Proteção contra reencaminhamento</p>
            <p className="mt-1">
              {event.verificationRequired
                ? `Ativa: cada convidado valida o telemóvel por SMS (máx. ${event.maxDevicesPerGuest} dispositivos).`
                : "Desativada: qualquer pessoa com o link abre o convite."}{" "}
              <Link href={`/dashboard/events/${id}/settings`} className="underline">Alterar</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
