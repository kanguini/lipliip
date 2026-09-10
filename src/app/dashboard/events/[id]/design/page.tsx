import Link from "next/link";
import { requireOwnedEvent } from "@/lib/auth";
import { getTemplate } from "@/lib/templates";
import { getAllTemplates } from "@/lib/templates-settings";
import { planForEvent } from "@/lib/platform";
import { updateDesignAction } from "@/app/dashboard/actions";
import { Alert, FlashFromSearch } from "@/components/ui";
import { TemplateCard } from "@/components/dashboard/TemplatePicker";
import { SubmitButton } from "@/components/dashboard/SubmitButton";

export default async function DesignPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { event } = await requireOwnedEvent(id);
  const [all, plan] = await Promise.all([getAllTemplates(), planForEvent(event)]);
  // Templates ativos para este tipo de evento; o template atual aparece sempre, mesmo que entretanto tenha sido desativado.
  const templates = all.filter((t) => t.types.includes(event.type) && (t.enabled || t.id === event.templateId));
  const current = all.find((t) => t.id === event.templateId) ?? getTemplate(event.templateId);
  const hasPremium = templates.some((t) => t.premium && t.id !== event.templateId);

  return (
    <>
      <FlashFromSearch {...sp} />
      {!plan.active && hasPremium && (
        <div className="mb-6"><Alert kind="info">Os templates com o selo Premium ficam disponíveis depois de <Link href={`/dashboard/events/${id}/activate`} className="underline">ativar o evento</Link>.</Alert></div>
      )}
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
                    <div className="rounded-xl peer-checked:ring-2 peer-checked:ring-brand-500 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2">
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
            <label className="label mt-2" htmlFor="d-accentColor">Cor de destaque</label>
            <input id="d-accentColor" type="color" name="accentColor" defaultValue={event.accentColor ?? current.colors.accent} className="h-10 w-20 cursor-pointer rounded border border-brand-200" />
            <p className="hint">Cor de destaque nos títulos e botões das secções do convite. Sem esta opção usa-se a cor do template.</p>
          </div>
          <div>
            <label className="label" htmlFor="d-coverImageUrl">Foto de capa (URL)</label>
            <input id="d-coverImageUrl" name="coverImageUrl" type="url" className="input" defaultValue={event.coverImageUrl ?? ""} placeholder="https://…/foto.jpg" />
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
