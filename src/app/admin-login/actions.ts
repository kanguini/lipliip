"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { rateLimit } from "@/lib/rate-limit";
import { clientIpFromHeaders } from "@/lib/guest-access";

export type AdminAuthState = { error?: string; email?: string };

// Hash de uma palavra-passe aleatória: o login demora o mesmo tempo quer a conta exista quer não.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8Z9m1hGq5w7bZ2yq6h0P3xk0R5H6oG";

async function clientIp() {
  return clientIpFromHeaders(await headers()) ?? "local";
}

/**
 * Entrada reservada à administração da plataforma, separada do login do cliente.
 * Só contas com acesso de administrador podem iniciar sessão por aqui; qualquer outra
 * recebe uma mensagem neutra, para não revelar quais contas são administradoras.
 */
export async function adminLoginAction(_prev: AdminAuthState, formData: FormData): Promise<AdminAuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const ip = await clientIp();
  const limit = rateLimit(`admin-login:${ip}:${email}`, 8, 15 * 60_000);
  const ipLimit = rateLimit(`admin-login-ip:${ip}`, 40, 15 * 60_000);
  if (!limit.ok || !ipLimit.ok) {
    const wait = Math.max(limit.retryAfterSec, ipLimit.retryAfterSec);
    return { email, error: `Demasiadas tentativas. Tente de novo dentro de ${Math.ceil(wait / 60)} minutos.` };
  }

  const user = await db.user.findUnique({ where: { email } });
  // Compara sempre (com um hash fictício se a conta não existir) para o tempo de resposta não revelar contas.
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  // Mensagem única para credenciais erradas E para contas sem acesso de administração:
  // não confirma que a conta existe nem que é (ou não) administradora.
  if (!user || !ok || !isAdmin(user)) {
    return { email, error: "Credenciais inválidas ou sem acesso de administração." };
  }
  if (user.suspendedAt) return { email, error: "Esta conta está suspensa." };

  await createSession(user.id);
  redirect("/admin");
}
