import { redirect } from "next/navigation";
import type { User } from "@prisma/client";
import { getCurrentUser } from "./auth";

/** Emails com acesso de administrador definidos no ambiente (ADMIN_EMAILS="a@x.pt,b@y.pt"), além do papel na base de dados. */
function envAdmins(): Set<string> {
  return new Set((process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean));
}

export function isAdmin(user: Pick<User, "email" | "role"> | null | undefined): boolean {
  if (!user) return false;
  return user.role === "ADMIN" || envAdmins().has(user.email.toLowerCase());
}

/**
 * Usado nas páginas e ações de /admin: utilizador autenticado com papel de administrador.
 * A administração tem uma entrada própria (/admin-login), separada da conta cliente —
 * quem não é administrador é sempre reencaminhado para lá, nunca para o painel do cliente.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!isAdmin(user)) redirect("/admin-login");
  return user!;
}
