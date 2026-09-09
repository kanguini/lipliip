import { ResetForm } from "./ResetForm";

export const metadata = { title: "Nova palavra-passe" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <ResetForm token={token ?? ""} />;
}
