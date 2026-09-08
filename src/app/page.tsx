import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { TEMPLATES } from "@/lib/templates";

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
          <Link href="/" className="font-display text-2xl font-semibold text-brand-700">
            Lipliip
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

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <span className="badge bg-brand-100 text-brand-800">Casamentos · Noivados · Aniversários</span>
        <h1 className="font-display mx-auto mt-6 max-w-3xl text-5xl font-semibold leading-tight text-stone-900">
          Convites digitais bonitos, pessoais e que <span className="text-brand-600">não podem ser repassados</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-600">
          Crie o convite em minutos, envie o link pessoal a cada convidado e receba confirmações de presença e reservas
          da lista de presentes num só lugar.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href={user ? "/dashboard/events/new" : "/register"} className="btn-primary px-6 py-3 text-base">
            Criar o meu convite
          </Link>
          <a href="#como-funciona" className="btn-secondary px-6 py-3 text-base">Como funciona</a>
        </div>
      </section>

      <section id="como-funciona" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-semibold">Como funciona</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              ["Crie a conta", "Registo em 30 segundos, sem cartão."],
              ["Escolha o template", "Preencha nomes, data, local, programa e lista de presentes."],
              ["Adicione os convidados", "Nome e telemóvel, um a um ou colando uma lista."],
              ["Envie e acompanhe", "Cada convidado recebe o seu link. Veja quem abriu, confirmou e reservou presentes."],
            ].map(([t, d], i) => (
              <li key={t} className="card">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">{i + 1}</span>
                <p className="mt-3 font-semibold">{t}</p>
                <p className="mt-1 text-sm text-stone-500">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-semibold">Tudo o que precisa para o grande dia</h2>
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

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-semibold">Templates</h2>
          <p className="mt-2 text-center text-stone-500">Pré-visualize cada estilo antes de escolher.</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {TEMPLATES.map((t) => (
              <Link
                key={t.id}
                href={`/preview/${t.id}`}
                className="group overflow-hidden rounded-xl border border-stone-200 shadow-sm transition hover:shadow-md"
              >
                <div className="flex h-40 flex-col items-center justify-center p-4 text-center" style={{ background: t.colors.bg, color: t.colors.text }}>
                  <span style={{ fontFamily: t.fontHeading, color: t.colors.accent }} className="text-2xl">Ana & João</span>
                  <span className="mt-1 text-xs opacity-70">14 · Junho · 2027</span>
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="mt-1 text-xs text-stone-500">{t.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
        Lipliip · Convites digitais · Feito com carinho
      </footer>
    </main>
  );
}
