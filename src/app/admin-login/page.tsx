import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { AdminLoginForm } from "./form";

// Não indexar a entrada da administração.
export const metadata = { title: "Administração", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  // Quem já tem sessão de administração vai direto à área reservada.
  if (isAdmin(await getCurrentUser())) redirect("/admin");
  return <AdminLoginForm />;
}
