/**
 * Dá (ou retira) o papel de administrador a um utilizador já registado.
 *   node scripts/make-admin.mjs email@exemplo.com          → ADMIN
 *   node scripts/make-admin.mjs email@exemplo.com --remove → USER
 * Em alternativa, defina ADMIN_EMAILS="email@exemplo.com" no ambiente (sem alterar a base de dados).
 */
import { PrismaClient } from "@prisma/client";

const [email, flag] = process.argv.slice(2);
if (!email) {
  console.error("Uso: node scripts/make-admin.mjs <email> [--remove]");
  process.exit(1);
}
const db = new PrismaClient();
try {
  const role = flag === "--remove" ? "USER" : "ADMIN";
  const user = await db.user.update({ where: { email: email.toLowerCase() }, data: { role }, select: { email: true, role: true } });
  console.log(`${user.email} → ${user.role}`);
} catch (e) {
  console.error("Não foi possível atualizar (o utilizador existe?):", e.message);
  process.exit(1);
} finally {
  await db.$disconnect();
}
