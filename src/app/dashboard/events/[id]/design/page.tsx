import Link from "next/link";
import { requireOwnedEvent } from "@/lib/auth";
import { templatesForType, getTemplate } from "@/lib/templates";
import { updateDesignAction } from "@/app/dashboard/actions";
import { FlashFromSearch } from "@/components/ui";
import { TemplateCard } from "@/components/dashboard/TemplatePicker";
import { SubmitButton } from "@/components/dashboard/SubmitButton";

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
        {(["2026", "classic"] as const).map((collection) => {
          const list = templates.filter((t) => t.collection === collection);
          if (!list.length) return null;
          return (
            <div key={collection} className="card">
              <h2 className="font-semibold">{collection === "2026" ? "Colecção 2026" : "Clássicos"}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((t) => (
                  <label key={t.id} className="cursor-pointer">
                    <input type="radio" name="templateId" value={t.id} defaultChecked={t.id === event.templateId} className="peer sr-only" />
                    <div className="rounded-xl peer-checked:ring-2 peer-checked:ring-brand-500">
                      <TemplateCard t={t} type={event.type} names={event.hostNames} selected={t.id === event.templateId} />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        <div className="card grid gap-4 sm:grid-cols-2">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="useCustomColor" defaultChecked={!!event.accentColor} /> Usar cor personalizada
            </label>
            <input type="color" name="accentColor" defaultValue={event.accentColor ?? current.colors.accent} className="mt-2 h-10 w-20 cursor-pointer rounded border border-brand-200" />
            <p className="hint">Cor de destaque nos títulos e botões das secções do convite. Sem esta opção usa-se a cor do template.</p>
          </div>
          <div>
            <label className="label">Foto de capa (URL)</label>
            <input name="coverImageUrl" type="url" className="input" defaultValue={event.coverImageUrl ?? ""} placeholder="https://…/foto.jpg" />
            <p className="hint">Nos cartazes da colecção 2026 a foto fica como fundo do cartaz. Cole o link de uma foto (Google Photos partilhado, Imgur, Dropbox com ?raw=1).</p>
          </div>
        </div>

        <div className="flex gap-2">
          <SubmitButton>Guardar design</SubmitButton>
          <Link href={`/dashboard/events/${id}/preview`} className="btn-secondary">Ver convite</Link>
        </div>
      </form>
    </>
  );
}
