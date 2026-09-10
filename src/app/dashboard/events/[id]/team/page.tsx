import { db } from "@/lib/db";
import { requireEventAccess } from "@/lib/access";
import { addMemberAction, leaveEventAction, removeMemberAction } from "@/app/dashboard/planner-actions";
import { Badge, FlashFromSearch } from "@/components/ui";
import { SubmitButton } from "@/components/dashboard/SubmitButton";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";

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
            <p className="text-xs text-muted">A pessoa precisa de ter conta na plataforma com este email. Ideal para o par, os pais, a cerimonialista ou quem faz a receção no dia.</p>
            <div><label className="label" htmlFor="tm-email">Email</label><input id="tm-email" name="email" type="email" className="input" required /></div>
            <div>
              <label className="label" htmlFor="tm-role">Papel</label>
              <select id="tm-role" name="role" className="input">
                <option value="EDITOR">Editor: gere tudo (convidados, tarefas, orçamento, design)</option>
                <option value="STAFF">Receção: só faz check-in no dia</option>
              </select>
            </div>
            <SubmitButton className="btn-primary w-full" pendingText="A adicionar…">Adicionar</SubmitButton>
          </form>
        ) : (
          <form action={leaveEventAction.bind(null, id)} className="card">
            <h2 className="font-semibold">O seu acesso</h2>
            <p className="mt-1 text-sm text-muted">É {role === "EDITOR" ? "editor" : "receção"} deste evento. Só o dono pode gerir a equipa.</p>
            <ConfirmButton className="btn-danger btn-sm mt-3" message="Sair deste evento? Deixará de o ver na sua lista.">Sair do evento</ConfirmButton>
          </form>
        )}
        <div className="card">
          <h2 className="font-semibold">Equipa</h2>
          <ul className="mt-3 divide-y divide-brand-100 text-sm">
            <li className="flex items-center justify-between py-2">
              <span><strong>{owner?.name}</strong> <span className="text-xs text-muted">{owner?.email}</span></span>
              <Badge tone="brand">Dono</Badge>
            </li>
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 py-2">
                <span><strong>{m.user.name}</strong> <span className="text-xs text-muted">{m.user.email}</span>{m.userId === user.id && <span className="text-xs text-brand-700"> (você)</span>}</span>
                <span className="flex items-center gap-2">
                  <Badge tone="muted">{m.role === "STAFF" ? "Receção" : "Editor"}</Badge>
                  {role === "OWNER" && <form action={removeMemberAction.bind(null, id, m.id)}><ConfirmButton className="text-xs text-muted hover:text-red-700" message={`Retirar o acesso de ${m.user.name} a este evento?`}>remover</ConfirmButton></form>}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg bg-brand-50 p-3 text-xs text-muted">
            Cerimonialistas: crie a sua conta, peça aos clientes que o adicionem como editor (ou crie o evento e adicione-os a eles). Todos os eventos em que participa aparecem em &ldquo;As suas celebrações&rdquo;.
          </p>
        </div>
      </div>
    </>
  );
}
