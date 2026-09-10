import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getAllTemplates } from "@/lib/templates-settings";
import { mediaUrl } from "@/lib/media";
import { db } from "@/lib/db";
import { EVENT_TYPES, type EventType } from "@/lib/event-types";
import { saveTemplateSettingsAction } from "@/app/admin/actions";
import { FlashFromSearch, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/dashboard/SubmitButton";
import { PremiumPill } from "@/components/dashboard/TemplatePicker";
import { ImagePlus, Plus } from "lucide-react";

export const metadata = { title: "Templates · Administração" };

export default async function AdminTemplatesPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const [all, customRows] = await Promise.all([
    getAllTemplates(),
    db.customTemplate.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  ]);
  // A tabela de definições só gere o catálogo fixo (o saveTemplateSettingsAction só escreve esses).
  const templates = all.filter((t) => !t.custom);

  return (
    <>
      <PageHeader
        title="Templates"
        subtitle="Quais os modelos disponíveis, quais são Premium (só para eventos ativados) e a ordem em que aparecem."
        actions={<Link href="/admin/templates/custom/new" className="btn-primary"><Plus className="h-4 w-4" aria-hidden />Carregar cartaz</Link>}
      />
      <FlashFromSearch ok={sp.ok} error={sp.error} />

      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><ImagePlus className="h-4 w-4 text-brand-500" aria-hidden />Cartazes carregados</h2>
        {customRows.length === 0 ? (
          <div className="card text-sm text-muted">
            Ainda não carregou nenhum cartaz. Carregue uma imagem 4:5 e ela passa a estar disponível como modelo de convite, com o texto do evento sobreposto por cima.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customRows.map((t) => (
              <Link key={t.id} href={`/admin/templates/custom/${t.id}`} className={`group overflow-hidden rounded-2xl border bg-white transition hover:border-brand-300 ${t.enabled ? "border-brand-200/70" : "border-dashed border-brand-200 opacity-70"}`}>
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(t.imageMediaId)} alt="" className="aspect-[4/5] w-full object-cover" />
                  {t.premium && <PremiumPill className="absolute left-2 top-2 shadow-sm" />}
                  {!t.enabled && <span className="badge absolute right-2 top-2 bg-white/90 text-brand-700 shadow-sm">Oculto</span>}
                </div>
                <div className="p-3">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted">{t.types.map((k) => EVENT_TYPES[k as EventType]?.label ?? k).join(", ")}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <h2 className="mb-3 font-semibold">Catálogo</h2>
      <form action={saveTemplateSettingsAction}>
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Template</th>
                <th className="px-3 py-3 font-medium">Colecção</th>
                <th className="px-3 py-3 font-medium">Tipos</th>
                <th className="px-3 py-3 font-medium">Ativo</th>
                <th className="px-3 py-3 font-medium">Premium</th>
                <th className="px-3 py-3 font-medium">Ordem</th>
                <th className="px-5 py-3 font-medium text-right">Pré-visualizar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {templates.map((t) => (
                <tr key={t.id} className={t.enabled ? "" : "opacity-60"}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-8 flex-none rounded-full" style={{ background: t.colors.bg, boxShadow: `inset 0 0 0 3px ${t.colors.accent}` }} aria-hidden />
                      <div>
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-muted">{t.tag} · <code>{t.id}</code></p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">{t.collection === "2026" ? "Colecção 2026" : "Clássicos"}</td>
                  <td className="px-3 py-3 text-xs text-muted">{t.types.map((k) => EVENT_TYPES[k as EventType]?.label ?? k).join(", ")}</td>
                  <td className="px-3 py-3">
                    <label className="flex items-center gap-2"><input type="checkbox" name={`enabled_${t.id}`} defaultChecked={t.enabled} aria-label={`${t.name} ativo`} /><span className="text-xs text-muted">visível</span></label>
                  </td>
                  <td className="px-3 py-3">
                    <label className="flex items-center gap-2"><input type="checkbox" name={`premium_${t.id}`} defaultChecked={t.premium} aria-label={`${t.name} premium`} /><span className="text-xs text-muted">premium</span></label>
                  </td>
                  <td className="px-3 py-3"><input name={`sort_${t.id}`} type="number" className="input w-20 py-1 text-xs" defaultValue={t.sortOrder} min={-999} max={999} aria-label={`Ordem de ${t.name}`} /></td>
                  <td className="px-5 py-3 text-right"><Link href={`/preview/${t.id}`} target="_blank" className="btn-ghost btn-sm">Ver</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <SubmitButton pendingText="A guardar…">Guardar templates</SubmitButton>
          <p className="text-xs text-muted">Templates desativados deixam de aparecer na escolha de modelos (eventos que já os usam mantêm-nos). Os Premium mostram um selo e só podem ser escolhidos em eventos ativados. Ordem: números menores aparecem primeiro.</p>
        </div>
      </form>
    </>
  );
}
