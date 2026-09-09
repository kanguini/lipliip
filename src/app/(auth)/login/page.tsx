import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "../auth-form";

export const metadata = { title: "Entrar" };

// Mensagens por código fixo: o texto nunca vem do URL.
const NOTICES: Record<string, string> = {
  password_changed: "Palavra-passe alterada. Entre com a nova palavra-passe.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { ok } = await searchParams;
  return <AuthForm mode="login" notice={ok && Object.hasOwn(NOTICES, ok) ? NOTICES[ok] : undefined} />;
}
