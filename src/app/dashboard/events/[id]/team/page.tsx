import { db } from "@/lib/db";
import { requireEventAccess } from "@/lib/access";
import { addMemberAction, leaveEventAction, removeMemberAction } from "@/app/dashboard/planner-actions";
import { FlashFromSearch } from "@/components/ui";

export default async function TeamPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { event, role, user } = await requireEventAccess(id);
  const [owner, members] = await Promise.all([
    db.user.findUnique({ where: { id: event.ownerId }, select: { name: true, email: true } }),
    db.eventMember.findMany({ where: { eventId: id }, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <>
      <FlashFromSearch {...sp} />
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {role === "OWNER" ? (
          <form action={addMemberAction.bind(null, id)} className="card space-y-3">
            <h2 className="font-semibold">Dar acesso a alguém</h2>
            <p className="text-xs text-[#8c7b87]">A pessoa precisa de ter conta na plataforma com este email. Ideal para o par, os pais, a cerimonialista ou quem faz a receção no dia.</p>
            <div><label className="label">Email</label><input name="email" type="email" className="input" required /></div>
            <div>
              <label className="label">Papel</label>
              <select name="role" className="input">
                <option value="EDITOR">Editor: gere tudo (convidados, tarefas, orçamento, design)</option>
                <option value="STAFF">Receção: só faz check-in no dia</option>
              </select>
            </div>
            <button className="btn-primary w-full">Adicionar</button>
          </form>
        ) : (
          <form action={leaveEventAction.bind(null, id)} className="card">
            <h2 className="font-semibold">O seu acesso</h2>
            <p className="mt-1 text-sm text-[#8c7b87]">É {role === "EDITOR" ? "editor" : "receção"} deste evento. Só o dono pode gerir a equipa.</p>
            <button className="btn-danger btn-sm mt-3">Sair do evento</button>
          </form>
        )}
        <div className="card">
          <h2 className="font-semibold">Equipa</h2>
          <ul className="mt-3 divide-y divide-brand-100 text-sm">
            <li className="flex items-center justify-between py-2">
              <span><strong>{owner?.name}</strong> <span className="text-xs text-[#8c7b87]">{owner?.email}</span></span>
              <span className="badge bg-brand-100 text-brand-700">Dono</span>
            </li>
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 py-2">
                <span><strong>{m.user.name}</strong> <span className="text-xs text-[#8c7b87]">{m.user.email}</span>{m.userId === user.id && <span className="text-xs text-brand-700"> (você)</span>}</span>
                <span className="flex items-center gap-2">
                  <span className="badge bg-[#eeeaee] text-[#6d5e69]">{m.role === "STAFF" ? "Receção" : "Editor"}</span>
                  {role === "OWNER" && <form action={removeMemberAction.bind(null, id, m.id)}><button className="text-xs text-[#a1939c] hover:text-red-700">remover</button></form>}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg bg-brand-50 p-3 text-xs text-[#8c7b87]">
            Cerimonialistas: crie a sua conta, peça aos clientes que o adicionem como editor (ou crie o evento e adicione-os a eles). Todos os eventos em que participa aparecem em "As suas celebrações".
          </p>
        </div>
      </div>
    </>
  );
}
