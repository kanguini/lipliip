import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { accessibleEventWhere } from "@/lib/access";
import { mediaUrl } from "@/lib/media";
import { formatEventDate } from "@/lib/format";
import { supplierCategoryLabel, supplierExcerpt, supplierLocation, supplierMapsUrl, supplierTelUrl, supplierWhatsappUrl } from "@/lib/suppliers";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { SupplierCategoryIcon } from "@/components/site/SupplierCategoryIcon";
import { FlashFromSearch } from "@/components/ui";
import { SubmitButton } from "@/components/dashboard/SubmitButton";
import { requestQuoteAction } from "../actions";
import { ArrowUpRight, ChevronLeft, Globe, Mail, MapPin, MessageCircle, Phone, Star } from "lucide-react";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const s = await db.supplier.findFirst({ where: { id, active: true }, select: { name: true, category: true, description: true, city: true, province: true } });
  if (!s) return { title: "Fornecedor" };
  const location = supplierLocation(s);
  return {
    title: `${s.name} · ${supplierCategoryLabel(s.category)}${location ? ` em ${location}` : ""}`,
    description: supplierExcerpt(s.description, 160) || `${s.name}: ${supplierCategoryLabel(s.category)} para casamentos, noivados e aniversários.`,
  };
}

export default async function SupplierDetailPage({ params, searchParams }: { params: Params; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ id }, sp, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  const [supplier, events] = await Promise.all([
    db.supplier.findFirst({ where: { id, active: true } }),
    user ? db.event.findMany({ where: accessibleEventWhere(user.id), orderBy: { date: "asc" }, select: { id: true, title: true, date: true, timezone: true }, take: 20 }) : Promise.resolve([]),
  ]);
  if (!supplier) notFound();

  const location = supplierLocation(supplier);
  const mapsUrl = supplierMapsUrl(supplier);
  const whatsapp = supplierWhatsappUrl(supplier.whatsapp ?? supplier.phone, `Olá ${supplier.name}! Encontrei-vos no Liplip e gostaria de pedir um orçamento.`);
  const tel = supplierTelUrl(supplier.phone);
  const hasContacts = !!(whatsapp || tel || supplier.email || supplier.website);

  return (
    <main>
      <SiteHeader loggedIn={!!user} active="fornecedores" />

      <div className="mx-auto max-w-6xl px-6 pb-20 pt-8">
        <Link href="/fornecedores" className="mb-5 inline-flex items-center gap-1 text-sm text-muted hover:text-brand-700"><ChevronLeft className="h-4 w-4" aria-hidden />Todos os fornecedores</Link>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <article>
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-brand-50 shadow-[0_2px_24px_rgba(84,27,56,0.06)]">
              {supplier.imageMediaId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(supplier.imageMediaId)} alt={supplier.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="icon-circle h-24 w-24 bg-brand-100 text-brand-700"><SupplierCategoryIcon category={supplier.category} className="h-10 w-10" strokeWidth={1.75} /></span>
                </div>
              )}
              {supplier.featured && (
                <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-joy-sun px-3 py-1 text-xs font-semibold text-brand-800 shadow-sm">
                  <Star className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />Em destaque
                </span>
              )}
            </div>

            <div className="mt-6">
              <Link href={`/fornecedores?category=${supplier.category}`} className="eyebrow inline-flex items-center gap-2 hover:text-brand-700">
                <SupplierCategoryIcon category={supplier.category} className="h-3.5 w-3.5" />
                {supplierCategoryLabel(supplier.category)}
              </Link>
              <h1 className="display-title mt-2 text-4xl sm:text-5xl">{supplier.name}<span className="plum">.</span></h1>
              {location && <p className="mt-2 flex items-center gap-1.5 text-sm text-muted"><MapPin className="h-4 w-4 text-brand-500" strokeWidth={1.75} aria-hidden />{location}</p>}
            </div>

            {supplier.description ? (
              <div className="card mt-6 whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink">{supplier.description}</div>
            ) : (
              <p className="card mt-6 text-sm text-muted">Este fornecedor ainda não tem descrição. Peça um orçamento para saber mais.</p>
            )}

            {(supplier.address || mapsUrl) && (
              <div className="card mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="icon-circle bg-brand-100 text-brand-700"><MapPin className="h-5 w-5" strokeWidth={1.75} aria-hidden /></span>
                  <div>
                    <p className="font-semibold">Onde fica</p>
                    <p className="text-sm text-muted">{[supplier.address, location].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
                {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">Ver no mapa <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></a>}
              </div>
            )}
          </article>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            {hasContacts && (
              <div className="card">
                <p className="font-semibold">Contactos</p>
                <div className="mt-3 grid gap-2">
                  {whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-primary justify-start"><MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden />WhatsApp</a>}
                  {tel && <a href={tel} className="btn-secondary justify-start"><Phone className="h-4 w-4" strokeWidth={1.75} aria-hidden />{supplier.phone}</a>}
                  {supplier.email && <a href={`mailto:${supplier.email}`} className="btn-secondary justify-start"><Mail className="h-4 w-4" strokeWidth={1.75} aria-hidden /><span className="truncate">{supplier.email}</span></a>}
                  {supplier.website && <a href={supplier.website} target="_blank" rel="noreferrer" className="btn-secondary justify-start"><Globe className="h-4 w-4" strokeWidth={1.75} aria-hidden /><span className="truncate">{supplier.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span></a>}
                </div>
              </div>
            )}

            <div id="orcamento" className="card scroll-mt-6">
              <p className="eyebrow">Sem compromisso</p>
              <h2 className="font-display mt-1 text-2xl">Pedir orçamento</h2>
              <p className="mt-1 text-sm text-muted">Diga-nos o que precisa e {supplier.name} responde-lhe diretamente.</p>
              <div className="mt-4"><FlashFromSearch ok={sp.ok} error={sp.error} /></div>
              <form action={requestQuoteAction.bind(null, supplier.id)} className="space-y-3">
                <div>
                  <label className="label" htmlFor="q-name">Nome</label>
                  <input id="q-name" name="name" className="input" required maxLength={80} defaultValue={user?.name ?? ""} autoComplete="name" />
                </div>
                <div>
                  <label className="label" htmlFor="q-phone">Telemóvel</label>
                  <input id="q-phone" name="phone" className="input" required inputMode="tel" placeholder="+244 923 000 000" defaultValue={user?.phone ?? ""} autoComplete="tel" />
                </div>
                <div>
                  <label className="label" htmlFor="q-email">Email <span className="font-normal text-muted">(opcional)</span></label>
                  <input id="q-email" name="email" type="email" className="input" maxLength={120} defaultValue={user?.email ?? ""} autoComplete="email" />
                </div>
                {events.length > 0 && (
                  <div>
                    <label className="label" htmlFor="q-event">Para que evento? <span className="font-normal text-muted">(opcional)</span></label>
                    <select id="q-event" name="eventId" className="input" defaultValue="">
                      <option value="">Não associar a um evento</option>
                      {events.map((e) => <option key={e.id} value={e.id}>{e.title} · {formatEventDate(e.date, false, e.timezone)}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="label" htmlFor="q-message">Mensagem</label>
                  <textarea id="q-message" name="message" className="input" rows={4} required minLength={10} maxLength={1500} placeholder="Data do evento, número de convidados, local e o que gostaria de saber…" />
                </div>
                <SubmitButton className="btn-primary w-full" pendingText="A enviar…">Enviar pedido</SubmitButton>
                {!user && <p className="hint text-center">Tem conta? <Link href="/login" className="underline">Entre</Link> para preencher automaticamente.</p>}
              </form>
            </div>
          </aside>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
