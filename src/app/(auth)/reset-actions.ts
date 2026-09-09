"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { clientIpFromHeaders } from "@/lib/guest-access";
import { getEmailProvider } from "@/lib/email";
import { appUrl } from "@/lib/urls";

const RESET_TTL_MIN = 30;
const sha = (t: string) => createHash("sha256").update(t).digest("hex");

export type ResetState = { error?: string; done?: boolean };

export async function requestResetAction(_prev: ResetState, fd: FormData): Promise<ResetState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Indique o seu email." };
  const ip = clientIpFromHeaders(await headers()) ?? "local";
  if (!rateLimit(`reset:${ip}`, 5, 60 * 60_000).ok || !rateLimit(`reset-email:${email}`, 3, 60 * 60_000).ok) {
    return { error: "Demasiados pedidos. Tente mais tarde." };
  }
  const user = await db.user.findUnique({ where: { email } });
  // Resposta igual quer o email exista ou não, para não revelar contas.
  if (user) {
    const token = randomBytes(32).toString("base64url");
    await db.passwordReset.create({ data: { userId: user.id, tokenHash: sha(token), expiresAt: new Date(Date.now() + RESET_TTL_MIN * 60_000) } });
    const link = `${appUrl()}/reset?token=${token}`;
    const res = await getEmailProvider().send(
      user.email,
      "Recuperar palavra-passe · Lipliip",
      `Olá ${user.name},\n\nPara definir uma nova palavra-passe abra este link (válido ${RESET_TTL_MIN} minutos):\n${link}\n\nSe não pediu isto, ignore este email.`,
    );
    if (!res.ok) console.error("Falha no envio de email de recuperação:", res.error);
  }
  return { done: true };
}

export async function resetPasswordAction(_prev: ResetState, fd: FormData): Promise<ResetState> {
  const token = String(fd.get("token") ?? "");
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: "A palavra-passe deve ter pelo menos 8 caracteres." };
  const reset = token ? await db.passwordReset.findUnique({ where: { tokenHash: sha(token) } }) : null;
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) return { error: "Link inválido ou expirado. Peça um novo." };
  await db.$transaction([
    db.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    db.user.update({ where: { id: reset.userId }, data: { passwordHash: await hashPassword(password) } }),
    db.session.deleteMany({ where: { userId: reset.userId } }),
  ]);
  redirect("/login?ok=" + encodeURIComponent("Palavra-passe alterada. Entre com a nova palavra-passe."));
}
