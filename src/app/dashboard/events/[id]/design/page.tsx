import Link from "next/link";
import { requireOwnedEvent } from "@/lib/auth";
import { templatesForType, getTemplate } from "@/lib/templates";
import { updateDesignAction } from "@/app/dashboard/actions";
import { FlashFromSearch } from "@/components/ui";

export default async function DesignPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { event } = await requireOwnedEvent(id);
  const templates = templatesForType(event.type);
  const current = getTemplate(event.templateId);

  return (
    <>
      <FlashFromSearch {...sp} />
      <form action={updateDesignAction.bind(null, id)} className="space-y-6">
        <div className="card">
          <h2 className="font-semibold">Template</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <label key={t.id} className="cursor-pointer overflow-hidden rounded-xl border border-stone-200 has-[:checked]:border-brand-500 has-[:checked]:ring-2 has-[:checked]:ring-brand-200">
                <input type="radio" name="templateId" value={t.id} defaultChecked={t.id === event.templateId} className="sr-only" />
                <div className="flex h-32 flex-col items-center justify-center p-4 text-center" style={{ background: t.colors.bg, color: t.colors.text }}>
                  <span style={{ fontFamily: t.fontHeading, color: t.colors.accent }} className="text-2xl">{event.hostNames}</span>
                </div>
                <div className="bg-white p-3">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-stone-500">{t.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="card grid gap-4 sm:grid-cols-2">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="useCustomColor" defaultChecked={!!event.accentColor} /> Usar cor personalizada
            </label>
            <input type="color" name="accentColor" defaultValue={event.accentColor ?? current.colors.accent} className="mt-2 h-10 w-20 cursor-pointer rounded border border-stone-300" />
            <p className="hint">Cor de destaque (títulos, botões). Sem esta opção usa-se a cor do template.</p>
          </div>
          <div>
            <label className="label">Foto de capa (URL)</label>
            <input name="coverImageUrl" type="url" className="input" defaultValue={event.coverImageUrl ?? ""} placeholder="https://…/foto.jpg" />
            <p className="hint">Cole o link de uma foto (ex: Google Photos partilhado, Imgur, Dropbox com ?raw=1).</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="btn-primary">Guardar design</button>
          <Link href={`/dashboard/events/${id}/preview`} className="btn-secondary">Ver convite</Link>
        </div>
      </form>
    </>
  );
}
