import { BackLink, FlashFromSearch } from "@/components/ui";
import { NewEventWizard } from "./NewEventWizard";

export const metadata = { title: "Novo convite" };

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ error?: string; type?: string; template?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <BackLink href="/dashboard/invites">Convites digitais</BackLink>
      <p className="eyebrow">Novo convite</p>
      <div className="mt-2 mb-6"><FlashFromSearch error={sp.error} /></div>
      <NewEventWizard initialType={sp.type} initialTemplate={sp.template} />
    </>
  );
}
