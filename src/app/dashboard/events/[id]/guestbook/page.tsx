import { db } from "@/lib/db";
import { requireOwnedEvent } from "@/lib/auth";
import { formatDateTimeShort } from "@/lib/format";
import { deleteGuestbookEntryAction } from "@/app/dashboard/actions";
import { FlashFromSearch } from "@/components/ui";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";

export default async function GuestbookPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { event } = await requireOwnedEvent(id);
  const entries = await db.guestbookEntry.findMany({ where: { eventId: id }, include: { guest: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <FlashFromSearch {...sp} />
      <div className="card">
        <h2 className="font-semibold">Livro de mensagens ({entries.length})</h2>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Ainda não há mensagens. Elas aparecem aqui e no convite de todos os convidados.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {entries.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 rounded-lg bg-stone-50 p-3 text-sm">
                <div>
                  <p className="italic">“{e.message}”</p>
                  <p className="mt-1 text-xs text-muted">— {e.guest.name}, {formatDateTimeShort(e.createdAt, event.timezone)}</p>
                </div>
                <form action={deleteGuestbookEntryAction.bind(null, e.id)}><ConfirmButton className="btn-ghost btn-sm" message={`Remover a mensagem de ${e.guest.name}? Não é possível recuperar.`}>Remover</ConfirmButton></form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
