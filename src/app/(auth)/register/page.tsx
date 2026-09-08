import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "../auth-form";

export const metadata = { title: "Criar conta" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <AuthForm mode="register" />;
}
