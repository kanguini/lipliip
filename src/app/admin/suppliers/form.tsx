import type { Supplier } from "@prisma/client";
import { ANGOLA_PROVINCES, SUPPLIER_CATEGORIES } from "@/lib/suppliers";
import { mediaUrl } from "@/lib/media";
import { SubmitButton } from "@/components/dashboard/SubmitButton";

/** Campos do fornecedor, partilhados entre "novo" e "editar". Inclui o upload da fotografia. */
export function SupplierFormFields({ supplier }: { supplier?: Supplier | null }) {
  const s = supplier;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="min-w-0 space-y-5">
        <fieldset className="card space-y-3">
          <legend>Identificação</legend>
          <div>
            <label className="label" htmlFor="s-name">Nome</label>
            <input id="s-name" name="name" className="input" required maxLength={120} defaultValue={s?.name ?? ""} placeholder="Salão Miramar, DJ Kudi, Doces da Tia…" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="s-category">Categoria</label>
              <select id="s-category" name="category" className="input" defaultValue={s?.category ?? "VENUE"} required>
                {SUPPLIER_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="s-province">Província</label>
              <select id="s-province" name="province" className="input" defaultValue={s?.province ?? ""}>
                <option value="">Sem província</option>
                {ANGOLA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="s-description">Descrição</label>
            <textarea id="s-description" name="description" className="input" rows={6} maxLength={3000} defaultValue={s?.description ?? ""} placeholder="Serviços, capacidade, o que inclui, zonas onde trabalha…" />
            <p className="hint">Aparece na página do fornecedor; a primeira frase aparece no cartão do diretório.</p>
          </div>
        </fieldset>

        <fieldset className="card space-y-3">
          <legend>Localização</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="s-city">Cidade / bairro</label>
              <input id="s-city" name="city" className="input" maxLength={80} defaultValue={s?.city ?? ""} placeholder="Talatona" />
            </div>
            <div>
              <label className="label" htmlFor="s-address">Morada</label>
              <input id="s-address" name="address" className="input" maxLength={200} defaultValue={s?.address ?? ""} placeholder="Rua da Missão, 12" />
            </div>
            <div>
              <label className="label" htmlFor="s-lat">Latitude <span className="font-normal text-muted">(opcional)</span></label>
              <input id="s-lat" name="lat" className="input" inputMode="decimal" defaultValue={s?.lat ?? ""} placeholder="-8.838" />
            </div>
            <div>
              <label className="label" htmlFor="s-lng">Longitude <span className="font-normal text-muted">(opcional)</span></label>
              <input id="s-lng" name="lng" className="input" inputMode="decimal" defaultValue={s?.lng ?? ""} placeholder="13.234" />
            </div>
          </div>
          <p className="hint">Com coordenadas, o botão &ldquo;Ver no mapa&rdquo; aponta ao local exato; sem elas, pesquisa pela morada.</p>
        </fieldset>

        <fieldset className="card space-y-3">
          <legend>Contactos</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="s-phone">Telefone</label>
              <input id="s-phone" name="phone" className="input" inputMode="tel" maxLength={30} defaultValue={s?.phone ?? ""} placeholder="+244 923 000 000" />
            </div>
            <div>
              <label className="label" htmlFor="s-whatsapp">WhatsApp <span className="font-normal text-muted">(se diferente)</span></label>
              <input id="s-whatsapp" name="whatsapp" className="input" inputMode="tel" maxLength={30} defaultValue={s?.whatsapp ?? ""} placeholder="+244 923 000 000" />
            </div>
            <div>
              <label className="label" htmlFor="s-email">Email</label>
              <input id="s-email" name="email" type="email" className="input" maxLength={120} defaultValue={s?.email ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="s-website">Site / Instagram</label>
              <input id="s-website" name="website" className="input" maxLength={300} defaultValue={s?.website ?? ""} placeholder="https://" />
            </div>
          </div>
        </fieldset>
      </div>

      <div className="min-w-0 space-y-5">
        <fieldset className="card space-y-3">
          <legend>Fotografia</legend>
          {s?.imageMediaId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(s.imageMediaId)} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover" />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-brand-50 text-sm text-muted">Sem fotografia</div>
          )}
          <div>
            <label className="label" htmlFor="s-image">{s?.imageMediaId ? "Substituir fotografia" : "Carregar fotografia"}</label>
            <input id="s-image" name="image" type="file" accept="image/*" className="input" />
            <p className="hint">JPG, PNG, WebP ou HEIC até 12 MB. É redimensionada para 1200 px.</p>
          </div>
        </fieldset>

        <fieldset className="card space-y-3">
          <legend>Publicação</legend>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="active" defaultChecked={s ? s.active : true} className="mt-1 h-4 w-4 accent-brand-700" />
            <span><span className="block font-medium">Ativo no diretório</span><span className="text-muted">Só os fornecedores ativos aparecem em /fornecedores.</span></span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="featured" defaultChecked={s?.featured ?? false} className="mt-1 h-4 w-4 accent-brand-700" />
            <span><span className="block font-medium">Em destaque</span><span className="text-muted">Aparece primeiro na lista, com um selo.</span></span>
          </label>
          <SubmitButton className="btn-primary w-full" pendingText="A guardar…">{s ? "Guardar alterações" : "Criar fornecedor"}</SubmitButton>
        </fieldset>
      </div>
    </div>
  );
}
