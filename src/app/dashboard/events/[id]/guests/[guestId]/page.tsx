import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireOwnedEvent } from "@/lib/auth";
import { formatDateTimeShort } from "@/lib/format";
import { inviteUrl } from "@/lib/urls";
import { deleteGuestAction, regenerateTokenAction, resetDevicesAction, updateGuestAction } from "@/app/dashboard/actions";
import { FlashFromSearch, RsvpBadge } from "@/components/ui";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";

const OUTCOME_LABEL: Record<string, string> = {
  VIEW: "Abriu o convite",
  OTP_SENT: "Código SMS enviado",
  OTP_OK: "Telemóvel validado",
  OTP_FAIL: "Código errado",
  OTP_RATE_LIMIT: "Demasiados pedidos de código",
  DEVICE_LIMIT: "Bloqueado: limite de dispositivos",
  CHECKIN: "Check-in à entrada",
};

export default async function GuestDetailPage({ params, searchParams }: { params: Promise<{ id: string; guestId: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id, guestId } = await params;
  const sp = await searchParams;
  const { event } = await requireOwnedEvent(id);
  const tz = event.timezone;
  const guest = await db.guest.findFirst({
    where: { id: guestId, eventId: id },
    include: {
      devices: { orderBy: { createdAt: "asc" } },
      accessLogs: { orderBy: { createdAt: "desc" }, take: 30 },
      reservations: { include: { gift: true } },
    },
  });
  if (!guest) notFound();
  const url = inviteUrl(guest.token);
  const suspicious = guest.accessLogs.some((l) => l.outcome === "DEVICE_LIMIT" || l.outcome === "OTP_RATE_LIMIT");

  return (
    <>
      <Link href={`/dashboard/events/${id}/guests`} className="mb-3 inline-block text-sm text-stone-500 hover:text-stone-900">← Convidados</Link>
      <FlashFromSearch {...sp} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <form action={updateGuestAction.bind(null, guest.id)} className="card space-y-3">
            <h2 className="font-semibold">Dados do convidado</h2>
            <div>
              <label className="label">Nome</label>
              <input name="name" className="input" defaultValue={guest.name} required />
            </div>
            <div>
              <label className="label">Telemóvel</label>
              <input name="phone" className="input" defaultValue={guest.phone} required />
              <p className="hint">Se mudar o número, o convidado terá de validar de novo.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Acompanhantes permitidos</label><input name="maxCompanions" type="number" min={0} className="input" defaultValue={guest.maxCompanions} /></div>
              <div><label className="label">Grupo</label><input name="groupName" className="input" defaultValue={guest.groupName ?? ""} /></div>
              <div><label className="label">Mesa</label><input name="tableNumber" className="input" defaultValue={guest.tableNumber ?? ""} /></div>
              <div><label className="label">Email</label><input name="email" type="email" className="input" defaultValue={guest.email ?? ""} /></div>
            </div>
            <button className="btn-primary">Guardar</button>
          </form>

          <div className="card space-y-3">
            <h2 className="font-semibold">Resposta</h2>
            <p className="text-sm"><RsvpBadge status={guest.rsvpStatus} />{guest.respondedAt && <span className="ml-2 text-stone-500">em {formatDateTimeShort(guest.respondedAt, tz)}</span>}</p>
            {guest.rsvpStatus === "ACCEPTED" && (
              <ul className="text-sm text-stone-700">
                <li>Acompanhantes: {guest.companions}{guest.companionNames ? ` (${guest.companionNames})` : ""}</li>
                {guest.dietaryNotes && <li>Restrições alimentares: {guest.dietaryNotes}</li>}
                {guest.songRequest && <li>Música pedida: 🎶 {guest.songRequest}</li>}
              </ul>
            )}
            {guest.rsvpMessage && <p className="text-sm italic text-stone-600">“{guest.rsvpMessage}”</p>}
            {guest.reservations.length > 0 && (
              <div className="text-sm">
                <p className="font-medium">Presentes reservados</p>
                <ul className="list-inside list-disc text-stone-700">
                  {guest.reservations.map((r) => <li key={r.id}>{r.gift.name}{r.amount ? ` (${r.amount} ${r.gift.kind === "CASH" ? "" : ""})` : r.quantity > 1 ? ` ×${r.quantity}` : ""}{r.note ? ` — ${r.note}` : ""}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card space-y-3">
            <h2 className="font-semibold">Link pessoal e segurança</h2>
            <p className="break-all rounded bg-stone-50 p-2 font-mono text-xs">{url}</p>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={url} />
              <form action={resetDevicesAction.bind(null, guest.id)}><button className="btn-secondary btn-sm">Remover dispositivos</button></form>
              <form action={regenerateTokenAction.bind(null, guest.id)}><ConfirmButton message="O link atual deixa de funcionar e terá de enviar o novo link ao convidado. Continuar?">Revogar e gerar novo link</ConfirmButton></form>
            </div>
            <p className="text-xs text-stone-500">
              Código de entrada: <span className="font-mono font-semibold">{guest.checkinCode}</span> · Telemóvel validado: {guest.verifiedAt ? formatDateTimeShort(guest.verifiedAt, tz) : "não"} · Aberto {guest.openCount}×
            </p>
            {suspicious && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                ⚠️ Há tentativas bloqueadas neste convite. Pode ser o próprio convidado num terceiro dispositivo, ou o link a ser repassado. Se necessário, revogue e gere um novo link.
              </p>
            )}
            <div>
              <p className="text-sm font-medium">Dispositivos autorizados ({guest.devices.length})</p>
              {guest.devices.length === 0 ? (
                <p className="text-xs text-stone-500">Nenhum.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-xs text-stone-600">
                  {guest.devices.map((d) => <li key={d.id}>{formatDateTimeShort(d.createdAt, tz)} · {d.userAgent?.slice(0, 80) ?? "?"}</li>)}
                </ul>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold">Histórico de acessos</h2>
            {guest.accessLogs.length === 0 ? (
              <p className="mt-2 text-sm text-stone-500">Sem registos.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-xs">
                {guest.accessLogs.map((l) => (
                  <li key={l.id} className={`flex justify-between gap-3 ${l.outcome === "DEVICE_LIMIT" || l.outcome === "OTP_RATE_LIMIT" ? "text-amber-800" : "text-stone-700"}`}>
                    <span>{OUTCOME_LABEL[l.outcome] ?? l.outcome}{l.ip ? ` · ${l.ip}` : ""}</span>
                    <span className="text-stone-400">{formatDateTimeShort(l.createdAt, tz)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form action={deleteGuestAction.bind(null, guest.id)} className="text-right">
            <ConfirmButton message={`Eliminar ${guest.name} e a sua resposta? Esta ação não pode ser anulada.`}>Eliminar convidado</ConfirmButton>
          </form>
        </div>
      </div>
    </>
  );
}
