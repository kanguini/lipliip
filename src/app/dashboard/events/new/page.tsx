import { EVENT_TYPES } from "@/lib/event-types";
import { BackLink, FlashFromSearch, PageHeader } from "@/components/ui";
import { EventDetailsFields } from "@/components/dashboard/EventForm";
import { NewEventWizard } from "./NewEventWizard";

export const metadata = { title: "Novo evento" };

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  // Os campos são componentes de servidor; passamos uma versão por tipo de evento para o wizard (cliente) escolher.
  const detailsFields = Object.fromEntries(Object.keys(EVENT_TYPES).map((t) => [t, <EventDetailsFields key={t} type={t} />]));
  return (
    <>
      <BackLink href="/dashboard">Os meus eventos</BackLink>
      <PageHeader title="Novo evento" />
      <FlashFromSearch {...sp} />
      <NewEventWizard detailsFields={detailsFields} />
    </>
  );
}
