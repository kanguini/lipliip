import { requireAdmin } from "@/lib/admin";
import { FlashFromSearch, PageHeader } from "@/components/ui";
import { CustomTemplateFormFields } from "../form";
import { createCustomTemplateAction } from "../../custom-actions";

export const metadata = { title: "Novo cartaz · Administração" };

export default async function NewCustomTemplatePage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Carregar cartaz" subtitle="Carregue uma imagem de cartaz (4:5) e ela passa a estar disponível como modelo de convite. O texto do evento é sobreposto por cima." />
      <FlashFromSearch ok={sp.ok} error={sp.error} />
      <form action={createCustomTemplateAction}>
        <CustomTemplateFormFields />
      </form>
    </>
  );
}
