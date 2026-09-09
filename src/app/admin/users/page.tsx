import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isAdmin, requireAdmin } from "@/lib/admin";
import { formatDateTimeShort } from "@/lib/format";
import { setUserRoleAction, toggleSuspendUserAction } from "@/app/admin/actions";
import { EmptyState, FlashFromSearch, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { Search } from "lucide-react";

export const metadata = { title: "Utilizadores · Administração" };

const PAGE_SIZE = 50;

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; ok?: string; error?: string }> }) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const where: Prisma.UserWhereInput = q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {};
  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, name: true, email: true, role: true, createdAt: true, suspendedAt: true, _count: { select: { events: true } } },
    }),
    db.user.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => `/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), ...(p > 1 ? { page: String(p) } : {}) }).toString()}`;
  const returnTo = qs(page);

  return (
    <>
      <PageHeader title="Utilizadores" subtitle={`${total} conta(s)${q ? ` a corresponder a "${q}"` : ""}.`} />
      <FlashFromSearch ok={sp.ok} error={sp.error} />
      <form className="mb-6 flex max-w-md gap-2">
        <input name="q" className="input" placeholder="Pesquisar por nome ou email" aria-label="Pesquisar utilizadores" defaultValue={q} />
        <button className="btn-secondary"><Search className="h-4 w-4" strokeWidth={1.75} aria-hidden />Pesquisar</button>
      </form>

      {users.length === 0 ? (
        <EmptyState title="Sem resultados" description={q ? "Tente outro nome ou email." : "Ainda não há contas registadas."} />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-3 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Papel</th>
                <th className="px-3 py-3 font-medium">Criado</th>
                <th className="px-3 py-3 font-medium">Eventos</th>
                <th className="px-3 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {users.map((u) => {
                const self = u.id === me.id;
                const admin = isAdmin(u);
                return (
                  <tr key={u.id} className="align-top">
                    <td className="px-5 py-3"><Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">{u.name}</Link>{self && <span className="ml-1 text-xs text-brand-600">(você)</span>}</td>
                    <td className="px-3 py-3 text-muted">{u.email}</td>
                    <td className="px-3 py-3">{admin ? <span className="badge bg-brand-100 text-brand-700">Admin{u.role !== "ADMIN" ? " (env)" : ""}</span> : <span className="badge bg-[#eeeaee] text-[#6d5e69]">Utilizador</span>}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-muted">{formatDateTimeShort(u.createdAt)}</td>
                    <td className="px-3 py-3">{u._count.events}</td>
                    <td className="px-3 py-3">{u.suspendedAt ? <span className="badge bg-[#f4e8eb] text-[#97596a]">Suspenso</span> : <span className="badge bg-[#e9f2eb] text-[#416c4a]">Ativo</span>}</td>
                    <td className="px-5 py-3">
                      {!self && (
                        <div className="flex flex-wrap justify-end gap-1">
                          <form action={setUserRoleAction.bind(null, u.id, u.role === "ADMIN" ? "USER" : "ADMIN", returnTo)}>
                            <ConfirmButton className="btn-ghost btn-sm" message={u.role === "ADMIN" ? `Retirar o papel de administrador a ${u.name}?` : `Tornar ${u.name} administrador da plataforma?`}>{u.role === "ADMIN" ? "Retirar admin" : "Tornar admin"}</ConfirmButton>
                          </form>
                          <form action={toggleSuspendUserAction.bind(null, u.id, returnTo)}>
                            <ConfirmButton className={u.suspendedAt ? "btn-secondary btn-sm" : "btn-danger btn-sm"} message={u.suspendedAt ? `Reativar a conta de ${u.name}?` : `Suspender a conta de ${u.name}? As sessões são terminadas e deixa de poder entrar.`}>{u.suspendedAt ? "Reativar" : "Suspender"}</ConfirmButton>
                          </form>
                          <Link href={`/admin/users/${u.id}`} className="btn-ghost btn-sm">Detalhe</Link>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted">Página {page} de {pages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={qs(page - 1)} className="btn-secondary btn-sm">Anterior</Link>}
            {page < pages && <Link href={qs(page + 1)} className="btn-secondary btn-sm">Seguinte</Link>}
          </div>
        </div>
      )}
    </>
  );
}
