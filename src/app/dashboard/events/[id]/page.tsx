import Link from "next/link";
import { db } from "@/lib/db";
import { requireOwnedEvent } from "@/lib/auth";
import { formatEventDate, formatMoney, formatTime } from "@/lib/format";
import { calendarDaysUntil } from "@/lib/timezone";
import { isSmsConfigured } from "@/lib/sms";
import { EVENT_TYPES, type EventType } from "@/lib/event-types";
import { FlashFromSearch } from "@/components/ui";
import { InvitationArt } from "@/components/templates/InvitationArt";
import { resolveTemplateMeta } from "@/lib/templates-settings";
import { planForEvent } from "@/lib/platform";
import { activationState } from "@/lib/activation";
import { ArrowRight, BadgeCheck, Check, Circle, ListChecks, Mail, Music, Salad, Users, Wallet } from "lucide-react";

export default async function EventOverviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { event } = await requireOwnedEvent(id);
  const [guests, gifts, tasks, budgetItems, plan, lastOrder] = await Promise.all([
    db.guest.findMany({ where: { eventId: id }, orderBy: { respondedAt: "desc" } }),
    db.giftItem.count({ where: { eventId: id } }),
    db.task.findMany({ where: { eventId: id }, orderBy: { dueAt: "asc" } }),
    db.budgetItem.findMany({ where: { eventId: id }, include: { payments: true } }),
    planForEvent(event),
    db.order.findFirst({ where: { eventId: id }, orderBy: { createdAt: "desc" }, select: { status: true, reference: true, createdAt: true, adminNote: true } }),
  ]);
  const template = await resolveTemplateMeta(event.templateId);
  const activation = activationState(plan, lastOrder);
  const activationCopy = {
    NOT_REQUIRED: { label: "Não é necessária", detail: "tudo desbloqueado", tone: "bg-joy-sage/40" },
    ACTIVE: { label: "Ativado", detail: event.activatedAt ? `desde ${formatEventDate(event.activatedAt, false, event.timezone)}` : "tudo desbloqueado", tone: "bg-joy-sage/40" },
    PENDING: { label: "Em análise", detail: lastOrder ? `comprovativo ${lastOrder.reference} enviado ${formatEventDate(lastOrder.createdAt, false, event.timezone)}` : "comprovativo enviado", tone: "bg-joy-sun/40" },
    REJECTED: { label: "Rejeitado", detail: lastOrder?.adminNote ? lastOrder.adminNote : "envie um novo comprovativo", tone: "bg-joy-coral/30" },
    NOT_REQUESTED: { label: "Por ativar", detail: `${formatMoney(plan.price, plan.currency)} · até ${Number.isFinite(plan.guestLimit) ? plan.guestLimit : "∞"} convidados grátis`, tone: "bg-joy-lilac/40" },
  }[activation];
  // Convites suspensos não contam para as estatísticas (tal como na lista de eventos).
  const active = guests.filter((g) => !g.suspendedAt);
  const accepted = active.filter((g) => g.rsvpStatus === "ACCEPTED");
  const pending = active.filter((g) => g.rsvpStatus === "PENDING");
  const sent = active.filter((g) => g.sentAt);
  const people = accepted.reduce((s, g) => s + 1 + g.companions, 0);
  const days = calendarDaysUntil(event.date, event.timezone);
  const tasksDone = tasks.filter((t) => t.completedAt).length;
  const nextTasks = tasks.filter((t) => !t.completedAt).slice(0, 3);
  const budgetTotal = budgetItems.reduce((s, i) => s + (i.contracted ?? i.estimated), 0);
  const budgetPaid = budgetItems.flatMap((i) => i.payments).filter((p) => p.paidAt).reduce((s, p) => s + p.amount, 0);
  const songs = accepted.filter((g) => g.songRequest);
  const dietary = accepted.filter((g) => g.dietaryNotes);

  // Próximos passos, por ordem natural
  const steps = [
    { done: !!event.message, label: "Escrever a mensagem de abertura", href: `/dashboard/events/${id}/settings` },
    { done: !!event.coverImageUrl || !!event.accentColor, label: "Escolher foto de capa e cor", href: `/dashboard/events/${id}/design` },
    { done: guests.length > 0, label: "Adicionar os convidados", href: `/dashboard/events/${id}/guests` },
    ...(activation === "NOT_REQUIRED" ? [] : [{ done: plan.active, label: activation === "PENDING" ? "Ativar evento (comprovativo em análise)" : "Ativar evento", href: `/dashboard/events/${id}/activate` }]),
    { done: sent.length > 0, label: "Enviar os links pessoais", href: `/dashboard/events/${id}/guests` },
    { done: gifts > 0 || !event.giftsEnabled, label: "Criar a lista de presentes", href: `/dashboard/events/${id}/gifts` },
  ];

  return (
    <>
      <FlashFromSearch {...sp} />
      {event.verificationRequired && !isSmsConfigured() && guests.length > 0 && (
        <div className="mb-6 rounded-3xl bg-joy-sun/30 p-5 text-sm text-brand-900">
          <p className="font-semibold">Envio de SMS ainda não configurado</p>
          <p className="mt-1">Os códigos de validação ficam nos registos do servidor. Configure a Twilio ou desative a validação por SMS em <Link href={`/dashboard/events/${id}/settings`} className="underline">Definições</Link> enquanto testa.</p>
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <div className="card flex gap-5">
          <div className="w-28 flex-none sm:w-36">
            <InvitationArt templateId={event.templateId} template={template} kicker={EVENT_TYPES[event.type as EventType]?.label ?? "Evento"} names={event.hostNames} dateLabel={formatEventDate(event.date, false, event.timezone)} placeLabel={event.venueName} coverImageUrl={event.coverImageUrl} small className="shadow-lg" />
          </div>
          <div className="min-w-0">
            <p className="eyebrow">{days > 1 ? `Faltam ${days} dias` : days === 1 ? "É amanhã" : days === 0 ? "É hoje" : "Já aconteceu"}</p>
            <p className="font-display mt-1 text-2xl leading-snug">{event.hostNames}</p>
            <p className="mt-1 text-sm text-muted">{formatEventDate(event.date, true, event.timezone)} · {formatTime(event.date, event.timezone)}</p>
            <p className="text-sm text-muted">{event.venueName}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/dashboard/events/${id}/preview`} className="btn-secondary btn-sm">Ver convite</Link>
              <Link href={`/dashboard/events/${id}/guests`} className="btn-primary btn-sm">Convidados <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-display text-xl">Próximos passos</h2>
          <ul className="mt-3 space-y-2">
            {steps.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-brand-50">
                  <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full ${s.done ? "bg-joy-sage text-brand-900" : "bg-brand-100 text-brand-400"}`}>{s.done ? <Check className="h-4 w-4" aria-hidden /> : <Circle className="h-3 w-3" aria-hidden />}</span>
                  <span className={`text-sm ${s.done ? "text-muted line-through" : "font-medium"}`}>{s.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Link href={`/dashboard/events/${id}/activate`} className="card transition hover:-translate-y-0.5">
          <span className={`icon-circle ${activationCopy.tone} text-brand-700`}><BadgeCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden /></span>
          <p className="font-display mt-4 text-2xl leading-tight">{activationCopy.label}</p>
          <p className="text-sm text-muted">Ativação · {activationCopy.detail}</p>
          {!plan.active && activation !== "PENDING" && <p className="mt-1 text-xs text-brand-500">Ativar evento</p>}
        </Link>
        <Link href={`/dashboard/events/${id}/guests`} className="card transition hover:-translate-y-0.5">
          <span className="icon-circle bg-joy-sky/40 text-brand-700"><Users className="h-5 w-5" strokeWidth={1.75} aria-hidden /></span>
          <p className="font-display mt-4 text-3xl">{accepted.length}<span className="text-base text-muted"> / {active.length}</span></p>
          <p className="text-sm text-muted">confirmados · {people} pessoas previstas</p>
          {pending.length > 0 && <p className="mt-1 text-xs text-brand-500">{pending.length} sem resposta</p>}
        </Link>
        <Link href={`/dashboard/events/${id}/guests`} className="card transition hover:-translate-y-0.5">
          <span className="icon-circle bg-joy-lilac/40 text-brand-700"><Mail className="h-5 w-5" strokeWidth={1.75} aria-hidden /></span>
          <p className="font-display mt-4 text-3xl">{sent.length}<span className="text-base text-muted"> / {active.length}</span></p>
          <p className="text-sm text-muted">convites enviados · {guests.filter((g) => g.firstOpenedAt).length} abertos</p>
        </Link>
        <Link href={`/dashboard/events/${id}/tasks`} className="card transition hover:-translate-y-0.5">
          <span className="icon-circle bg-joy-sage/40 text-brand-700"><ListChecks className="h-5 w-5" strokeWidth={1.75} aria-hidden /></span>
          <p className="font-display mt-4 text-3xl">{tasks.length ? Math.round((tasksDone / tasks.length) * 100) : 0}%</p>
          <p className="text-sm text-muted">das tarefas feitas</p>
          {nextTasks[0] && <p className="mt-1 truncate text-xs text-brand-500">próxima: {nextTasks[0].title}</p>}
        </Link>
        <Link href={`/dashboard/events/${id}/budget`} className="card transition hover:-translate-y-0.5">
          <span className="icon-circle bg-joy-sun/40 text-brand-700"><Wallet className="h-5 w-5" strokeWidth={1.75} aria-hidden /></span>
          <p className="font-display mt-4 text-3xl">{formatMoney(budgetTotal, event.currency)}</p>
          <p className="text-sm text-muted">orçamento · pago {formatMoney(budgetPaid, event.currency)}</p>
        </Link>
      </section>

      {(songs.length > 0 || dietary.length > 0) && (
        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          {songs.length > 0 && (
            <div className="card">
              <h2 className="flex items-center gap-2 font-semibold"><Music className="h-4 w-4 text-brand-600" aria-hidden />Músicas pedidas ({songs.length})</h2>
              <ul className="mt-2 space-y-1 text-sm">{songs.map((g) => <li key={g.id}>{g.songRequest} <span className="text-xs text-muted">· {g.name}</span></li>)}</ul>
            </div>
          )}
          {dietary.length > 0 && (
            <div className="card">
              <h2 className="flex items-center gap-2 font-semibold"><Salad className="h-4 w-4 text-brand-600" aria-hidden />Restrições alimentares ({dietary.length})</h2>
              <ul className="mt-2 space-y-1 text-sm">{dietary.map((g) => <li key={g.id}>{g.name}: {g.dietaryNotes}</li>)}</ul>
            </div>
          )}
        </section>
      )}
    </>
  );
}
