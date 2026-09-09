import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { receptionAccess } from "@/lib/reception";
import { matchesGuestQuery } from "@/lib/checkin";
import { formatEventDate, formatTime } from "@/lib/format";
import { receptionCheckinAction, receptionLogoutAction, receptionPinAction, receptionRequestDoneAction, receptionToggleCheckinAction } from "@/app/dashboard/reception-actions";
import { FlashFromSearch, StatCard } from "@/components/ui";
import { SubmitButton } from "@/components/dashboard/SubmitButton";
import { AutoRefresh } from "@/components/dashboard/AutoRefresh";
import { RequestKindBadge } from "@/components/dashboard/RequestKindBadge";
import { CheckinForm } from "@/app/dashboard/events/[id]/checkin/CheckinForm";
import { Check, CheckCircle2, KeyRound, LogOut } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Receção", robots: { index: false, follow: false } };

export default async function ReceptionPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ ok?: string; error?: string; q?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const { event, authorized } = await receptionAccess(token);
  if (!event) notFound();

  if (!authorized) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
        <div className="card space-y-4 text-center">
          <span className="icon-circle mx-auto bg-brand-100 text-brand-700"><KeyRound className="h-5 w-5" strokeWidth={1.75} aria-hidden /></span>
          <div>
            <span className="eyebrow">Receção</span>
            <h1 className="display-title mt-1 text-2xl">{event.title}</h1>
            <p className="mt-1 text-sm text-muted">{formatEventDate(event.date, true, event.timezone)}</p>
          </div>
          <FlashFromSearch {...sp} />
          <form action={receptionPinAction.bind(null, token)} className="space-y-3">
            <div className="text-left">
              <label className="label" htmlFor="pin">PIN de 4 dígitos</label>
              <input id="pin" name="pin" inputMode="numeric" pattern="[0-9]*" maxLength={4} autoComplete="one-time-code" required className="input text-center font-mono text-2xl tracking-[0.5em]" autoFocus />
              <p className="hint">Peça o PIN aos anfitriões. Fica ligado neste dispositivo durante 3 dias.</p>
            </div>
            <SubmitButton className="btn-primary w-full" pendingText="A verificar…">Entrar</SubmitButton>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-muted">Liplip · acesso de receção sem conta</p>
      </main>
    );
  }

  const [guests, requests] = await Promise.all([
    db.guest.findMany({
      where: { eventId: event.id },
      select: { id: true, name: true, checkinCode: true, rsvpStatus: true, companions: true, tableNumber: true, suspendedAt: true, checkedInAt: true },
      orderBy: { name: "asc" },
    }),
    db.guestRequest.findMany({
      where: { eventId: event.id },
      select: { id: true, kind: true, text: true, status: true, createdAt: true, guest: { select: { name: true, tableNumber: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);
  const list = guests.filter((g) => matchesGuestQuery(g, sp.q ?? ""));
  const accepted = guests.filter((g) => g.rsvpStatus === "ACCEPTED" && !g.suspendedAt);
  const arrived = guests.filter((g) => g.checkedInAt);
  const expected = accepted.reduce((s, g) => s + 1 + g.companions, 0);
  // Pedidos novos primeiro, os mais antigos à cabeça (fila); depois os já feitos, mais recentes primeiro.
  const openRequests = requests.filter((r) => r.status !== "DONE").reverse();
  const doneRequests = requests.filter((r) => r.status === "DONE").slice(0, 30);
  const tz = event.timezone;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <AutoRefresh seconds={20} />
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Receção</span>
          <h1 className="display-title mt-1 text-3xl">{event.title}</h1>
          <p className="text-sm text-muted">{formatEventDate(event.date, true, tz)} · {formatTime(event.date, tz)} · {event.venueName}</p>
        </div>
        <form action={receptionLogoutAction.bind(null, token)}>
          <button className="btn-ghost btn-sm"><LogOut className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />Sair</button>
        </form>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Confirmados" value={accepted.length} />
        <StatCard label="Pessoas esperadas" value={expected} />
        <StatCard label="Já entraram" value={arrived.length} tone="good" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <div className="card space-y-4">
            <h2 className="font-semibold">Validar entrada</h2>
            <p className="text-sm text-muted">Leia o QR do convite ou escreva o código de 6 caracteres.</p>
            <FlashFromSearch {...sp} />
            <CheckinForm action={receptionCheckinAction.bind(null, token)} />
          </div>
          <div className="card">
            <h2 className="font-semibold">Pedidos dos convidados {openRequests.length > 0 && <span className="badge ml-1 bg-[#fff1d6] text-[#8b6b2d]">{openRequests.length} por atender</span>}</h2>
            {openRequests.length === 0 && doneRequests.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Sem pedidos por agora. Os convidados pedem comida, bebida ou música a partir do convite.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {openRequests.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-3 rounded-2xl bg-brand-50 p-3 text-sm">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <RequestKindBadge kind={r.kind} />
                        <span className="font-medium">{r.guest.name}</span>
                        {r.guest.tableNumber && <span className="badge bg-white text-brand-700">Mesa {r.guest.tableNumber}</span>}
                        <span className="text-xs text-muted">{formatTime(r.createdAt, tz)}</span>
                      </div>
                      <p className="mt-1 break-words">{r.text}</p>
                    </div>
                    <form action={receptionRequestDoneAction.bind(null, token, r.id)} className="flex-none">
                      <SubmitButton className="btn-primary btn-sm" pendingText="…"><Check className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />Feito</SubmitButton>
                    </form>
                  </li>
                ))}
                {doneRequests.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-3 rounded-2xl bg-stone-50 p-3 text-sm opacity-70">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <RequestKindBadge kind={r.kind} />
                        <span className="font-medium">{r.guest.name}</span>
                        <span className="text-xs text-muted">{formatTime(r.createdAt, tz)} · feito</span>
                      </div>
                      <p className="mt-1 break-words line-through">{r.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Lista de convidados</h2>
            <form><input name="q" className="input w-44" placeholder="Nome ou código" aria-label="Pesquisar convidado" defaultValue={sp.q ?? ""} /></form>
          </div>
          {list.length === 0 && <p className="mt-3 text-sm text-muted">Nenhum convidado corresponde à pesquisa.</p>}
          <ul className="mt-3 divide-y divide-stone-100 text-sm">
            {list.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <span className={g.checkedInAt ? "inline-flex items-center gap-1 font-medium text-emerald-700" : "font-medium"}>{g.checkedInAt ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : null}{g.name}</span>
                  <span className="ml-2 font-mono text-xs text-stone-400">{g.checkinCode}</span>
                  <span className="ml-2 text-xs text-stone-500">
                    {g.checkedInAt ? `entrou às ${formatTime(g.checkedInAt, tz)}` : g.suspendedAt ? "suspenso" : g.rsvpStatus === "ACCEPTED" ? `confirmado${g.companions ? ` +${g.companions}` : ""}` : g.rsvpStatus === "DECLINED" ? "não vinha" : "sem resposta"}
                    {g.tableNumber ? ` · mesa ${g.tableNumber}` : ""}
                  </span>
                </div>
                <form action={receptionToggleCheckinAction.bind(null, token, g.id, sp.q ?? null)}>
                  <button className={g.checkedInAt ? "btn-ghost btn-sm" : "btn-secondary btn-sm"}>{g.checkedInAt ? "Anular" : "Entrou"}</button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-muted">Liplip · acesso de receção sem conta · atualiza-se a cada 20 segundos</p>
    </main>
  );
}
