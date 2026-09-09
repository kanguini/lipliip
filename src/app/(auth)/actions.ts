"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { clientIpFromHeaders } from "@/lib/guest-access";

async function clientIp() {
  return clientIpFromHeaders(await headers()) ?? "local";
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Indique o seu nome"),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(8, "A palavra-passe deve ter pelo menos 8 caracteres"),
});

export type AuthState = { error?: string; email?: string; name?: string };

// Hash de uma palavra-passe aleatória: usado para o login demorar o mesmo tempo quer o email exista quer não.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8Z9m1hGq5w7bZ2yq6h0P3xk0R5H6oG";

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const values = { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? "") };
  const limit = rateLimit(`register:${await clientIp()}`, 10, 60 * 60_000);
  if (!limit.ok) return { ...values, error: "Demasiados registos a partir desta ligação. Tente mais tarde." };
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ...values, error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;

  let user;
  try {
    user = await db.user.create({ data: { name, email, passwordHash: await hashPassword(password) } });
  } catch {
    // Mensagem neutra para não confirmar que emails existem.
    return { ...values, error: "Não foi possível criar a conta com este email. Se já tem conta, entre ou recupere a palavra-passe." };
  }
  await createSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const ip = await clientIp();
  const limit = rateLimit(`login:${ip}:${email}`, 8, 15 * 60_000);
  const ipLimit = rateLimit(`login-ip:${ip}`, 40, 15 * 60_000);
  const emailLimit = rateLimit(`login-email:${email}`, 30, 15 * 60_000);
  if (!limit.ok || !ipLimit.ok || !emailLimit.ok) {
    const wait = Math.max(limit.retryAfterSec, ipLimit.retryAfterSec, emailLimit.retryAfterSec);
    return { email, error: `Demasiadas tentativas. Tente de novo dentro de ${Math.ceil(wait / 60)} minutos.` };
  }
  const user = await db.user.findUnique({ where: { email } });
  // Compara sempre (com um hash fictício se o utilizador não existir) para o tempo de resposta não revelar contas.
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    return { email, error: "Email ou palavra-passe incorretos." };
  }
  if (user.suspendedAt) return { email, error: "Esta conta está suspensa. Contacte o suporte da plataforma." };
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
