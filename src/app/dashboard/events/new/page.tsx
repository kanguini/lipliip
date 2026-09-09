import { BackLink, FlashFromSearch } from "@/components/ui";
import { NewEventWizard } from "./NewEventWizard";
import { getAvailableTemplates } from "@/lib/templates-settings";

export const metadata = { title: "Novo convite" };

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ error?: string; type?: string; template?: string }> }) {
  // searchParams primeiro: marca a rota como dinâmica antes de tocar na base de dados (evita a query no build).
  const sp = await searchParams;
  const templates = await getAvailableTemplates();
  return (
    <>
      <BackLink href="/dashboard/invites">Convites digitais</BackLink>
      <p className="eyebrow">Novo convite</p>
      <div className="mt-2 mb-6"><FlashFromSearch error={sp.error} /></div>
      <NewEventWizard initialType={sp.type} initialTemplate={sp.template} templates={templates} />
    </>
  );
}
