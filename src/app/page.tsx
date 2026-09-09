import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { TEMPLATES } from "@/lib/templates";
import { InvitationArt } from "@/components/templates/InvitationArt";
import { EVENT_TYPES, type EventType } from "@/lib/event-types";

const FEATURES = [
  {
    title: "Convites nominativos e intransmissíveis",
    text: "Cada convidado recebe um link único. Para o abrir tem de confirmar um código enviado por SMS para o número que registou. Se o link for reencaminhado, simplesmente não abre.",
    icon: "🔒",
  },
  {
    title: "Confirmação de presença (RSVP)",
    text: "O convidado confirma se vai, quantos acompanhantes leva (dentro do limite que definiu) e restrições alimentares. Você vê tudo em tempo real.",
    icon: "✅",
  },
  {
    title: "Lista de presentes",
    text: "Adicione presentes com preço e link da loja, ou aceite contribuições por IBAN / MB WAY. Os convidados reservam sem repetições.",
    icon: "🎁",
  },
  {
    title: "Templates para cada ocasião",
    text: "Casamento, noivado ou aniversário: escolha um template, personalize cores, mensagem, programa e foto de capa.",
    icon: "🎨",
  },
  {
    title: "Envio por WhatsApp e SMS",
    text: "Envie o link pessoal a cada convidado por WhatsApp com mensagem pré-escrita, por SMS ou copie o link. Acompanhe quem já abriu.",
    icon: "📲",
  },
  {
    title: "Check-in com QR code no dia",
    text: "Cada convite tem um QR code e um código curto. À entrada, valide quem chega e evite entradas duplicadas.",
    icon: "🎟️",
  },
  {
    title: "Programa, mapa e calendário",
    text: "Contagem decrescente ao segundo, programa do dia, mapa do local e botão para adicionar ao calendário (Google ou iPhone).",
    icon: "📍",
  },
  {
    title: "A vossa história, galeria e padrinhos",
    text: "Linha do tempo com fotos, galeria, padrinhos e madrinhas, música de fundo, hashtag e informações úteis (alojamento, transporte).",
    icon: "📖",
  },
  {
    title: "Envelope animado e música",
    text: "O convidado toca para abrir o envelope e o convite revela-se com a vossa música. Uma experiência, não um PDF.",
    icon: "💌",
  },
  {
    title: "Lembretes, mesas e Excel",
    text: "Lembre por WhatsApp quem ainda não respondeu, monte o plano de mesas e exporte tudo (restrições alimentares, músicas pedidas) para Excel.",
    icon: "📊",
  },
  {
    title: "Livro de mensagens e pedidos de música",
    text: "Os convidados deixam uma mensagem carinhosa e sugerem a música que não pode faltar. Fica tudo no seu painel.",
    icon: "🎶",
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  return (
    <main>
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="wordmark text-3xl" aria-label="Lipliip">
            lipliip<span>.</span>
          </Link>
          <nav className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="btn-primary">Ir para o painel</Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost">Entrar</Link>
                <Link href="/register" className="btn-primary">Criar conta grátis</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div>
          <p className="eyebrow">Para os dias que ficam</p>
          <h1 className="display-title mt-4 text-5xl leading-[1.1] sm:text-6xl">
            As pessoas certas.<br />O seu momento<span className="plum">.</span>
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
        <div className="grid grid-cols-2 gap-4">
          <InvitationArt templateId="rubi" kicker="Vamos casar" names="Sofia & Miguel" dateLabel="12 de dezembro de 2026" placeLabel="Quinta da Serra · 16:00" caption="Uma vida inteira começa aqui." className="rotate-[-3deg] shadow-2xl" />
          <InvitationArt templateId="festa" kicker="Festa de aniversário" names="Os 30 da Beatriz" dateLabel="5 de setembro de 2027" placeLabel="Porto · 20:00" caption="Vamos celebrar!" className="mt-10 rotate-[3deg] shadow-2xl" />
        </div>
      </section>

      <section id="como-funciona" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="eyebrow text-center">Cada momento, um laço</p>
          <h2 className="display-title mt-3 text-center text-4xl">Como funciona<span className="plum">.</span></h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              ["Crie a conta", "Registo em 30 segundos, sem cartão."],
              ["Escolha o template", "Preencha nomes, data, local, programa e lista de presentes."],
              ["Adicione os convidados", "Nome e telemóvel, um a um ou colando uma lista."],
              ["Envie e acompanhe", "Cada convidado recebe o seu link. Veja quem abriu, confirmou e reservou presentes."],
            ].map(([t, d], i) => (
              <li key={t} className="card">
                <span className="font-display text-2xl text-brand-400">0{i + 1}</span>
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
          <h2 className="display-title mt-3 text-center text-4xl">Tudo o que precisa para o grande dia<span className="plum">.</span></h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="card">
                <div className="text-3xl">{f.icon}</div>
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
              <h2 className="display-title mt-3 text-4xl">Um convite à altura da sua história<span className="plum">.</span></h2>
              <p className="mt-3 max-w-xl text-[#8c7b87]">Seis cartazes da colecção 2026 e cinco clássicos. Personalize nomes, cores, foto e mensagem.</p>
            </div>
            <span className="hidden border-y border-brand-300 px-4 py-2 text-center font-display text-[0.64rem] uppercase leading-loose tracking-[0.14em] text-[#947880] sm:block">
              Colecção<br /><strong className="text-2xl font-normal tracking-[0.13em]">2026</strong>
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
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-200 text-brand-700 transition group-hover:bg-brand-100">↗</span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-5">
            {TEMPLATES.filter((t) => t.collection === "classic").map((t) => (
              <Link key={t.id} href={`/preview/${t.id}`} className="overflow-hidden rounded-lg border border-brand-200/70 transition hover:shadow-md">
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

      <footer className="border-t border-brand-200/70 py-10 text-center text-sm text-[#9e8d96]">
        <span className="wordmark text-2xl">lipliip<span>.</span></span>
        <p className="mt-2">Os momentos passam. Os laços ficam.</p>
      </footer>
    </main>
  );
}
