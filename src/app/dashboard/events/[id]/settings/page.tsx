import { requireOwnedEvent } from "@/lib/auth";
import { deleteEventAction, updateEventAction } from "@/app/dashboard/actions";
import { EventDetailsFields } from "@/components/dashboard/EventForm";
import { FlashFromSearch } from "@/components/ui";

export default async function SettingsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { event } = await requireOwnedEvent(id);
  return (
    <>
      <FlashFromSearch {...sp} />
      <form action={updateEventAction.bind(null, id)} className="space-y-6">
        <input type="hidden" name="type" value={event.type} />
        <input type="hidden" name="templateId" value={event.templateId} />
        <input type="hidden" name="coverImageUrl" value={event.coverImageUrl ?? ""} />
        <input type="hidden" name="accentColor" value={event.accentColor ?? ""} />
        <EventDetailsFields event={event} type={event.type} />
        <button className="btn-primary">Guardar alterações</button>
      </form>
      <div className="card mt-10 border-red-200">
        <h2 className="font-semibold text-red-800">Zona de perigo</h2>
        <p className="mt-1 text-sm text-stone-600">Eliminar o evento apaga convidados, respostas, presentes e mensagens. Todos os links deixam de funcionar.</p>
        <form action={deleteEventAction.bind(null, id)} className="mt-3">
          <button className="btn-danger">Eliminar evento</button>
        </form>
      </div>
    </>
  );
}
