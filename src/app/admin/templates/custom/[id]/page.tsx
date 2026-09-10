import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { FlashFromSearch, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { CustomTemplateFormFields } from "../form";
import { deleteCustomTemplateAction, updateCustomTemplateAction } from "../../custom-actions";

export const metadata = { title: "Editar cartaz · Administração" };

export default async function EditCustomTemplatePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const template = await db.customTemplate.findUnique({ where: { id } });
  if (!template) notFound();

  return (
    <>
      <PageHeader
        title={template.name}
        subtitle="Cartaz personalizado"
        actions={<Link href={`/preview/${template.id}`} target="_blank" className="btn-secondary btn-sm">Pré-visualizar</Link>}
      />
      <FlashFromSearch ok={sp.ok} error={sp.error} />
      <form action={updateCustomTemplateAction.bind(null, id)}>
        <CustomTemplateFormFields template={template} />
      </form>
      <form action={deleteCustomTemplateAction.bind(null, id)} className="mt-6">
        <ConfirmButton message="Eliminar este template? Os eventos que já o usam mantêm o modelo, mas deixa de estar disponível.">Eliminar template</ConfirmButton>
      </form>
    </>
  );
}
