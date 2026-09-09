"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";

function flash(kind: "ok" | "error", message: string): never {
  redirect(`/dashboard/account?${kind}=${encodeURIComponent(message)}`);
}

export async function updateProfileAction(fd: FormData) {
  const user = await requireUser();
  const name = String(fd.get("name") ?? "").trim().slice(0, 120);
  if (name.length < 2) flash("error", "Indique o seu nome.");
  await db.user.update({ where: { id: user.id }, data: { name, phone: String(fd.get("phone") ?? "").trim().slice(0, 30) || null } });
  flash("ok", "Perfil atualizado.");
}

export async function changePasswordAction(fd: FormData) {
  const user = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (!(await verifyPassword(current, user.passwordHash))) flash("error", "A palavra-passe atual está errada.");
  if (next.length < 8) flash("error", "A nova palavra-passe deve ter pelo menos 8 caracteres.");
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } }),
    // Termina todas as sessões por segurança.
    db.session.deleteMany({ where: { userId: user.id } }),
  ]);
  redirect("/login?ok=password_changed");
}
