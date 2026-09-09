/**
 * Aplica as migrações Prisma em produção.
 * Bases de dados criadas antes das migrações (com `db push`) são "baselinadas": a migração inicial é marcada como
 * aplicada sem correr, e só as seguintes são executadas. Bases vazias recebem todas as migrações.
 */
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const run = (cmd) => execSync(cmd, { stdio: "inherit" });

try {
  const [{ has_events, has_migrations }] = await db.$queryRawUnsafe(
    `SELECT to_regclass('"Event"') IS NOT NULL AS has_events, to_regclass('_prisma_migrations') IS NOT NULL AS has_migrations`,
  );
  if (has_events && !has_migrations) {
    console.log("Base de dados existente sem histórico de migrações: a marcar a migração inicial como aplicada.");
    try {
      run("npx prisma migrate resolve --applied 0001_baseline");
    } catch (e) {
      // Outra réplica pode ter marcado a migração entretanto (P3008): segue para o deploy, que verifica o estado real.
      console.warn("Não foi possível marcar a migração inicial (provavelmente já marcada por outra instância):", e.message);
    }
  }
} finally {
  await db.$disconnect();
}
run("npx prisma migrate deploy");
