"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/** Marca todas as notificações como lidas (guarda o momento em que o utilizador as viu). */
export async function markNotificationsReadAction() {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: { notifiedAt: new Date() } });
  revalidatePath("/dashboard", "layout");
}
