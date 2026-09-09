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

export type AuthState = { error?: string };

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const limit = rateLimit(`register:${await clientIp()}`, 10, 60 * 60_000);
  if (!limit.ok) return { error: "Demasiados registos a partir desta ligação. Tente mais tarde." };
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return { error: "Já existe uma conta com este email." };

  let user;
  try {
    user = await db.user.create({ data: { name, email, passwordHash: await hashPassword(password) } });
  } catch {
    return { error: "Já existe uma conta com este email." };
  }
  await createSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const limit = rateLimit(`login:${await clientIp()}:${email}`, 8, 15 * 60_000);
  const emailLimit = rateLimit(`login-email:${email}`, 30, 15 * 60_000);
  if (!limit.ok || !emailLimit.ok) return { error: `Demasiadas tentativas. Tente de novo dentro de ${Math.ceil(Math.max(limit.retryAfterSec, emailLimit.retryAfterSec) / 60)} minutos.` };
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Email ou palavra-passe incorretos." };
  }
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
