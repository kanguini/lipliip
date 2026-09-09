import { requireAdmin } from "@/lib/admin";
import { BackLink, FlashFromSearch, PageHeader } from "@/components/ui";
import { createSupplierAction } from "../../suppliers-actions";
import { SupplierFormFields } from "../form";

export const metadata = { title: "Novo fornecedor" };

export default async function NewSupplierPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  return (
    <>
      <BackLink href="/admin/suppliers">Fornecedores</BackLink>
      <PageHeader title="Novo fornecedor" subtitle="Aparece no diretório público assim que estiver ativo." />
      <FlashFromSearch {...sp} />
      <form action={createSupplierAction}>
        <SupplierFormFields />
      </form>
    </>
  );
}
