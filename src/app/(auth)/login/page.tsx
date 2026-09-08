import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "../auth-form";

export const metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { ok } = await searchParams;
  return <AuthForm mode="login" notice={ok} />;
}
