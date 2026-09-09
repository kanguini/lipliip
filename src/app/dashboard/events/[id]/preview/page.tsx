import Link from "next/link";
import { db } from "@/lib/db";
import { requireEventAccess } from "@/lib/access";
import { parseProgram } from "@/lib/event-types";
import { Invite } from "@/components/templates";
import { DetailsSection, ProgramSection } from "@/components/invite/Sections";
import { formatMoney } from "@/lib/format";

/** Pré-visualização do convite tal como um convidado o vê (sem as partes interativas). */
export default async function EventPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { event } = await requireEventAccess(id, { allowStaff: true });
  const gifts = await db.giftItem.findMany({ where: { eventId: id }, orderBy: { createdAt: "asc" } });
  return (
    <div className="-mx-5 -my-8 lg:-mx-10 lg:-my-10">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 bg-white/90 px-4 py-2 text-sm backdrop-blur">
        <span><span className="hidden sm:inline">Pré-visualização · </span>é assim que os convidados veem o convite</span>
        <div className="flex gap-2">
          <Link href={`/dashboard/events/${id}/design`} className="btn-secondary btn-sm">Mudar design</Link>
          <Link href={`/dashboard/events/${id}`} className="btn-primary btn-sm">Voltar ao painel</Link>
        </div>
      </div>
      <Invite event={event} guestName="Nome do Convidado">
        <DetailsSection event={event} />
        <ProgramSection items={parseProgram(event.programJson)} />
        <div className="invite-card text-sm opacity-80">
          <p className="font-semibold">Confirmar presença</p>
          <p>Aqui o convidado diz se vai, quantos acompanhantes leva e restrições alimentares.</p>
        </div>
        {event.giftsEnabled && (
          <div className="invite-card text-sm opacity-80">
            <p className="font-semibold">Lista de presentes ({gifts.length})</p>
            <ul className="mt-1 list-inside list-disc">{gifts.slice(0, 6).map((g) => <li key={g.id}>{g.name}{g.price != null ? ` · ${formatMoney(g.price, event.currency)}` : ""}</li>)}</ul>
          </div>
        )}
        {event.guestbookEnabled && <div className="invite-card text-sm opacity-80"><p className="font-semibold">Livro de mensagens</p></div>}
        <div className="invite-card text-sm opacity-80"><p className="font-semibold">QR code de entrada</p><p>Cada convidado tem o seu, validado no check-in.</p></div>
      </Invite>
    </div>
  );
}
