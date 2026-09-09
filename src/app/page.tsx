import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { TEMPLATES } from "@/lib/templates";
import { InvitationArt } from "@/components/templates/InvitationArt";
import { EVENT_TYPES, type EventType } from "@/lib/event-types";
import { SUPPLIER_CATEGORIES } from "@/lib/suppliers";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { SupplierCategoryIcon } from "@/components/site/SupplierCategoryIcon";
import { ArrowUpRight, BarChart3, BookOpen, CheckCircle2, Gift, Lock, Mail, MapPin, Music, Palette, Send, Ticket, type LucideIcon } from "lucide-react";

const FEATURES: { title: string; text: string; icon: LucideIcon }[] = [
  {
    title: "Convites nominativos e intransmissíveis",
    text: "Cada convidado recebe um link único. Para o abrir tem de confirmar um código enviado por SMS para o número que registou. Se o link for reencaminhado, simplesmente não abre.",
    icon: Lock,
  },
  {
    title: "Confirmação de presença (RSVP)",
    text: "O convidado confirma se vai, quantos acompanhantes leva (dentro do limite que definiu) e restrições alimentares. Você vê tudo em tempo real.",
    icon: CheckCircle2,
  },
  {
    title: "Lista de presentes",
    text: "Adicione presentes com preço e link da loja, ou aceite contribuições por IBAN / MB WAY. Os convidados reservam sem repetições.",
    icon: Gift,
  },
  {
    title: "Templates para cada ocasião",
    text: "Casamento, noivado ou aniversário: escolha um template, personalize cores, mensagem, programa e foto de capa.",
    icon: Palette,
  },
  {
    title: "Envio por WhatsApp e SMS",
    text: "Envie o link pessoal a cada convidado por WhatsApp com mensagem pré-escrita, por SMS ou copie o link. Acompanhe quem já abriu.",
    icon: Send,
  },
  {
    title: "Check-in com QR code no dia",
    text: "Cada convite tem um QR code e um código curto. À entrada, valide quem chega e evite entradas duplicadas.",
    icon: Ticket,
  },
  {
    title: "Programa, mapa e calendário",
    text: "Contagem decrescente ao segundo, programa do dia, mapa do local e botão para adicionar ao calendário (Google ou iPhone).",
    icon: MapPin,
  },
  {
    title: "A vossa história, galeria e padrinhos",
    text: "Linha do tempo com fotos, galeria, padrinhos e madrinhas, música de fundo, hashtag e informações úteis (alojamento, transporte).",
    icon: BookOpen,
  },
  {
    title: "Envelope animado e música",
    text: "O convidado toca para abrir o envelope e o convite revela-se com a vossa música. Uma experiência, não um PDF.",
    icon: Mail,
  },
  {
    title: "Lembretes, mesas e Excel",
    text: "Lembre por WhatsApp quem ainda não respondeu, monte o plano de mesas e exporte tudo (restrições alimentares, músicas pedidas) para Excel.",
    icon: BarChart3,
  },
  {
    title: "Livro de mensagens e pedidos de música",
    text: "Os convidados deixam uma mensagem carinhosa e sugerem a música que não pode faltar. Fica tudo no seu painel.",
    icon: Music,
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  return (
    <main>
      <SiteHeader loggedIn={!!user} />

      <section className="relative mx-auto grid max-w-6xl items-center gap-12 overflow-hidden px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <span className="blob -left-24 top-10 h-72 w-72 bg-joy-sun/40" aria-hidden />
        <span className="blob -bottom-20 right-1/3 h-56 w-56 bg-joy-sky/40" aria-hidden />
        <span className="blob right-0 top-0 h-40 w-40 bg-joy-coral/25" aria-hidden />
        <div className="relative">
          <p className="eyebrow">Para os dias que ficam</p>
          <h1 className="display-title mt-4 text-5xl leading-[1.05] sm:text-7xl">
            As pessoas certas.<br />O seu <em>momento</em><span className="plum">.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#8c7b87]">
            Convites digitais para casamentos, noivados e aniversários. Cada convidado recebe um link pessoal, ligado ao
            seu telemóvel, que não pode ser repassado. Confirmações de presença, lista de presentes e entrada por QR no mesmo lugar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={user ? "/dashboard/events/new" : "/register"} className="btn-primary px-6 py-3 text-base">
              Criar o meu convite
            </Link>
            <a href="#templates" className="btn-secondary px-6 py-3 text-base">Ver a colecção</a>
          </div>
          <p className="mt-6 text-xs text-[#9e8d96]">Grátis para começar · sem cartão · convidados ilimitados enquanto testa</p>
        </div>
        <div className="relative grid grid-cols-2 gap-4">
          <InvitationArt templateId="rubi" kicker="Vamos casar" names="Sofia & Miguel" dateLabel="12 de dezembro de 2026" placeLabel="Quinta da Serra · 16:00" caption="Uma vida inteira começa aqui." className="rotate-[-3deg] shadow-2xl" />
          <InvitationArt templateId="festa" kicker="Festa de aniversário" names="Os 30 da Beatriz" dateLabel="5 de setembro de 2027" placeLabel="Porto · 20:00" caption="Vamos celebrar!" className="mt-10 rotate-[3deg] shadow-2xl" />
        </div>
      </section>

      <section id="como-funciona" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="eyebrow text-center">Cada momento, um laço</p>
          <h2 className="display-title mt-3 text-center text-4xl">Como <em>funciona</em><span className="plum">.</span></h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              ["Crie a conta", "Registo em 30 segundos, sem cartão."],
              ["Escolha o template", "Preencha nomes, data, local, programa e lista de presentes."],
              ["Adicione os convidados", "Nome e telemóvel, um a um ou colando uma lista."],
              ["Envie e acompanhe", "Cada convidado recebe o seu link. Veja quem abriu, confirmou e reservou presentes."],
            ].map(([t, d], i) => (
              <li key={t} className="card">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-joy-sun font-display text-lg text-brand-800">{i + 1}</span>
                <p className="mt-3 font-semibold">{t}</p>
                <p className="mt-1 text-sm text-stone-500">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="eyebrow text-center">Tudo no mesmo lugar</p>
          <h2 className="display-title mt-3 text-center text-4xl">Tudo o que precisa para o <em>grande dia</em><span className="plum">.</span></h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="card">
                <span className="icon-circle bg-brand-100 text-brand-700"><f.icon className="h-5 w-5" strokeWidth={1.5} aria-hidden /></span>
                <p className="mt-3 font-semibold">{f.title}</p>
                <p className="mt-1 text-sm text-stone-500">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="templates" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Escolha como começa</p>
              <h2 className="display-title mt-3 text-4xl">Um convite à altura da sua <em>história</em><span className="plum">.</span></h2>
              <p className="mt-3 max-w-xl text-[#8c7b87]">Seis cartazes da colecção 2026 e cinco clássicos. Personalize nomes, cores, foto e mensagem.</p>
            </div>
            <span className="hidden h-24 w-24 flex-col items-center justify-center rounded-full bg-joy-sun text-center font-display text-[0.6rem] uppercase leading-tight tracking-[0.14em] text-brand-800 sm:flex">
              Colecção<br /><strong className="text-2xl font-semibold tracking-[0.05em]">2026</strong>
            </span>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.filter((t) => t.collection === "2026").map((t) => {
              const type = t.types[0] as EventType;
              return (
                <Link key={t.id} href={`/preview/${t.id}`} className="group block">
                  <InvitationArt
                    templateId={t.id}
                    kicker={EVENT_TYPES[type].label}
                    names={t.sample.names}
                    dateLabel="12 de dezembro de 2026"
                    placeLabel="Luanda · 16:00"
                    caption={t.sample.caption}
                    className="shadow-md transition group-hover:-translate-y-1 group-hover:shadow-xl"
                  />
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-[#95818f]">{t.tag}</p>
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-200 text-brand-700 transition group-hover:bg-brand-100"><ArrowUpRight className="h-4 w-4" aria-hidden /></span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-5">
            {TEMPLATES.filter((t) => t.collection === "classic").map((t) => (
              <Link key={t.id} href={`/preview/${t.id}`} className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(84,27,56,0.06)] transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-24 flex-col items-center justify-center p-3 text-center" style={{ background: t.colors.bg, color: t.colors.text }}>
                  <span style={{ fontFamily: t.fontHeading, color: t.colors.accent }} className="text-lg">{t.sample.names}</span>
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium">{t.name}</p>
                  <p className="text-[10px] text-[#95818f]">{t.tag}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="fornecedores" className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-brand-700 px-8 py-12 text-white sm:px-12 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10">
            <span className="blob -right-16 -top-16 h-56 w-56 bg-joy-coral/40" aria-hidden />
            <span className="blob -bottom-20 left-1/3 h-48 w-48 bg-joy-sun/30" aria-hidden />
            <div className="relative">
              <p className="eyebrow text-joy-sun">Diretório de fornecedores</p>
              <h2 className="display-title mt-3 text-4xl text-white sm:text-5xl">Encontre fornecedores para o seu <em className="text-joy-sun">evento</em><span className="plum">.</span></h2>
              <p className="mt-4 max-w-xl text-white/80">
                Salões e espaços, buffet, decoração, música, fotografia, bolos e muito mais, em todas as províncias de Angola. Veja os contactos e peça orçamentos sem sair do Liplip.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/fornecedores" className="btn bg-white text-brand-700 shadow-[0_6px_18px_rgba(0,0,0,0.18)] hover:bg-brand-50">Explorar o diretório <ArrowUpRight className="h-4 w-4" aria-hidden /></Link>
              </div>
            </div>
            <ul className="relative mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:mt-0">
              {SUPPLIER_CATEGORIES.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href={`/fornecedores?category=${c.id}`} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/20">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/15"><SupplierCategoryIcon category={c.id} className="h-4 w-4" /></span>
                    <span className="leading-tight">{c.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
