import Link from "next/link";
import { notFound } from "next/navigation";
import { TEMPLATES } from "@/lib/templates";
import { getCustomTemplate } from "@/lib/custom-templates";
import { Invite, sampleEventForTemplate } from "@/components/templates";
import { DetailsSection, PartySection, ProgramSection, StorySection } from "@/components/invite/Sections";

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ templateId: t.id }));
}

export default async function TemplatePreviewPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  const meta = TEMPLATES.find((t) => t.id === templateId) ?? (await getCustomTemplate(templateId));
  if (!meta) notFound();
  const event = sampleEventForTemplate(templateId, meta);
  return (
    <>
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-white/90 px-4 py-2 text-sm backdrop-blur">
        <span>Pré-visualização do template <strong>{meta.name}</strong> (dados de exemplo)</span>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <Link key={t.id} href={`/preview/${t.id}`} className={`btn-sm ${t.id === templateId ? "btn-primary" : "btn-secondary"}`}>{t.name}</Link>
          ))}
          <Link href="/register" className="btn-primary btn-sm">Usar este template</Link>
        </div>
      </div>
      <Invite event={event} guestName="Convidado Exemplo" template={meta}>
        <DetailsSection event={event} />
        <StorySection
          title="A nossa história"
          items={[
            { date: "2019", title: "Conhecemo-nos", text: "Numa festa de amigos, entre gargalhadas e uma música que ainda hoje é a nossa." },
            { date: "2023", title: "O pedido", text: "Ao pôr do sol, com o mar por testemunha." },
            { date: "2027", title: "O grande dia", text: "Queremos-te connosco." },
          ]}
        />
        <ProgramSection items={[{ time: "15:00", title: "Cerimónia" }, { time: "17:00", title: "Copo de água" }, { time: "20:00", title: "Jantar e festa" }]} />
        <PartySection title="Padrinhos e madrinhas" members={[{ name: "Rita Sousa", role: "Madrinha" }, { name: "Tiago Lopes", role: "Padrinho" }, { name: "Leonor", role: "Menina das alianças" }]} />
        <div className="invite-card text-center text-sm opacity-70">Aqui aparecem a confirmação de presença, a lista de presentes, a galeria, o livro de mensagens e o QR de entrada.</div>
      </Invite>
    </>
  );
}
