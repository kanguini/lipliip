import type { CustomTemplate } from "@prisma/client";
import { mediaUrl } from "@/lib/media";
import { EVENT_TYPES, type EventType } from "@/lib/event-types";
import { CUSTOM_TEMPLATE_TYPES } from "@/lib/custom-templates";
import { SubmitButton } from "@/components/dashboard/SubmitButton";

/** Campos do cartaz personalizado, partilhados entre "novo" e "editar". */
export function CustomTemplateFormFields({ template }: { template?: CustomTemplate | null }) {
  const t = template;
  const selectedTypes = new Set(t?.types ?? ["WEDDING"]);
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="min-w-0 space-y-5">
        <fieldset className="card space-y-3">
          <legend>Identificação</legend>
          <div>
            <label className="label" htmlFor="t-name">Nome</label>
            <input id="t-name" name="name" className="input" required maxLength={120} defaultValue={t?.name ?? ""} placeholder="Bordeaux Floral, Dourado Noturno…" />
          </div>
          <div>
            <label className="label" htmlFor="t-tag">Etiqueta <span className="font-normal text-muted">(opcional)</span></label>
            <input id="t-tag" name="tag" className="input" maxLength={60} defaultValue={t?.tag ?? ""} placeholder="Romântico · Floral" />
            <p className="hint">Aparece por baixo do nome na escolha de modelos.</p>
          </div>
          <div>
            <label className="label" htmlFor="t-description">Descrição <span className="font-normal text-muted">(opcional)</span></label>
            <textarea id="t-description" name="description" className="input" rows={2} maxLength={400} defaultValue={t?.description ?? ""} />
          </div>
          <fieldset className="min-w-0">
            <legend className="label mb-1">Tipos de evento</legend>
            <div className="flex flex-wrap gap-3">
              {CUSTOM_TEMPLATE_TYPES.map((k) => (
                <label key={k} className="flex items-center gap-2 rounded-full border border-brand-200 px-3 py-1.5 text-sm">
                  <input type="checkbox" name="types" value={k} defaultChecked={selectedTypes.has(k)} className="h-4 w-4 accent-brand-700" />
                  {EVENT_TYPES[k as EventType].label}
                </label>
              ))}
            </div>
            <p className="hint">Em que ocasiões este cartaz pode ser escolhido.</p>
          </fieldset>
        </fieldset>

        <fieldset className="card space-y-3">
          <legend>Texto de exemplo</legend>
          <p className="hint">Usado nas pré-visualizações; no convite real são substituídos pelos dados do evento.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="t-sampleNames">Nomes</label>
              <input id="t-sampleNames" name="sampleNames" className="input" maxLength={60} defaultValue={t?.sampleNames ?? "Sofia & Miguel"} />
            </div>
            <div>
              <label className="label" htmlFor="t-sampleCaption">Legenda</label>
              <input id="t-sampleCaption" name="sampleCaption" className="input" maxLength={120} defaultValue={t?.sampleCaption ?? "Uma vida inteira começa aqui."} />
            </div>
          </div>
        </fieldset>

        <fieldset className="card space-y-3">
          <legend>Cores do convite</legend>
          <p className="hint">O texto do cartaz é branco sobre a imagem. Estas cores aplicam-se às secções do convite (botões, títulos e fundo).</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="t-accent">Destaque</label>
              <input id="t-accent" name="accentColor" type="color" className="h-11 w-full cursor-pointer rounded-xl border border-brand-200" defaultValue={t?.accentColor ?? "#541b38"} />
            </div>
            <div>
              <label className="label" htmlFor="t-bg">Fundo</label>
              <input id="t-bg" name="bgColor" type="color" className="h-11 w-full cursor-pointer rounded-xl border border-brand-200" defaultValue={t?.bgColor ?? "#fbf5f7"} />
            </div>
            <div>
              <label className="label" htmlFor="t-text">Texto</label>
              <input id="t-text" name="textColor" type="color" className="h-11 w-full cursor-pointer rounded-xl border border-brand-200" defaultValue={t?.textColor ?? "#30262e"} />
            </div>
          </div>
        </fieldset>
      </div>

      <div className="min-w-0 space-y-5">
        <fieldset className="card space-y-3">
          <legend>Cartaz</legend>
          {t?.imageMediaId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(t.imageMediaId)} alt="" className="aspect-[4/5] w-full rounded-2xl object-cover" />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center rounded-2xl bg-brand-50 text-sm text-muted">Sem cartaz</div>
          )}
          <div>
            <label className="label" htmlFor="t-image">{t?.imageMediaId ? "Substituir cartaz" : "Carregar cartaz"}</label>
            <input id="t-image" name="image" type="file" accept="image/*" className="input" required={!t} />
            <p className="hint">Imagem 4:5 (vertical), JPG/PNG/WebP até 12 MB. É o fundo do convite; escreva o texto por cima automaticamente.</p>
          </div>
        </fieldset>

        <fieldset className="card space-y-3">
          <legend>Publicação</legend>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="enabled" defaultChecked={t ? t.enabled : true} className="mt-1 h-4 w-4 accent-brand-700" />
            <span><span className="block font-medium">Disponível</span><span className="text-muted">Aparece na escolha de modelos.</span></span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="premium" defaultChecked={t?.premium ?? false} className="mt-1 h-4 w-4 accent-brand-700" />
            <span><span className="block font-medium">Premium</span><span className="text-muted">Só pode ser escolhido em eventos ativados.</span></span>
          </label>
          <div>
            <label className="label" htmlFor="t-sort">Ordem</label>
            <input id="t-sort" name="sortOrder" type="number" className="input w-24" defaultValue={t?.sortOrder ?? 0} min={-999} max={999} />
          </div>
          <SubmitButton className="btn-primary w-full" pendingText="A guardar…">{t ? "Guardar alterações" : "Carregar template"}</SubmitButton>
        </fieldset>
      </div>
    </div>
  );
}
