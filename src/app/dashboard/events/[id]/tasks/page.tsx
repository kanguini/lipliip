import { db } from "@/lib/db";
import { requireEventAccess } from "@/lib/access";
import { formatEventDate } from "@/lib/format";
import { calendarDaysUntil } from "@/lib/timezone";
import { addTaskAction, deleteTaskAction, generateChecklistAction, toggleTaskAction } from "@/app/dashboard/planner-actions";
import Link from "next/link";
import { planForEvent } from "@/lib/platform";
import { Alert, FlashFromSearch, StatCard } from "@/components/ui";
import { Check, UserRound, X, Plus } from "lucide-react";
import { SubmitButton } from "@/components/dashboard/SubmitButton";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";

export default async function TasksPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string; show?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { event } = await requireEventAccess(id);
  const [tasks, plan] = await Promise.all([db.task.findMany({ where: { eventId: id }, orderBy: [{ dueAt: "asc" }, { sortOrder: "asc" }] }), planForEvent(event)]);
  const done = tasks.filter((t) => t.completedAt);
  const open = tasks.filter((t) => !t.completedAt);
  const overdue = open.filter((t) => t.dueAt && calendarDaysUntil(t.dueAt, event.timezone) < 0);
  const list = sp.show === "done" ? done : sp.show === "all" ? tasks : open;
  const progress = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
  const categories = [...new Set(tasks.map((t) => t.category).filter(Boolean))] as string[];

  return (
    <>
      <FlashFromSearch {...sp} />
      {!plan.canPlan && (
        <div className="mb-6"><Alert kind="info">O planeamento (tarefas, orçamento e fornecedores) fica disponível depois de <Link href={`/dashboard/events/${id}/activate`} className="font-semibold underline">ativar o evento</Link>. Até lá pode consultar o que já existe.</Alert></div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Progresso" value={`${progress}%`} tone="good" />
        <StatCard label="Por fazer" value={open.length} />
        <StatCard label="Atrasadas" value={overdue.length} tone={overdue.length ? "bad" : "default"} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          {plan.canPlan && (
          <>
          <details className="card" open={tasks.length === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-brand-800"><span>Nova tarefa</span><span className="icon-circle h-8 w-8 bg-brand-100 text-brand-700"><Plus className="h-4 w-4" aria-hidden /></span></summary>
            <form action={addTaskAction.bind(null, id)} className="mt-4 space-y-3">
            <div><label className="label" htmlFor="t-title">Tarefa</label><input id="t-title" name="title" className="input" required placeholder="Ex.: Prova do vestido" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="t-dueAt">Prazo</label><input id="t-dueAt" name="dueAt" type="date" className="input" /></div>
              <div><label className="label" htmlFor="t-category">Categoria</label><input id="t-category" name="category" className="input" list="task-cats" placeholder="Catering" /><datalist id="task-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist></div>
            </div>
            <div><label className="label" htmlFor="t-assignee">Quem trata</label><input id="t-assignee" name="assignee" className="input" placeholder="Ana, João, cerimonialista…" /></div>
            <SubmitButton className="btn-primary w-full" pendingText="A adicionar…">Adicionar</SubmitButton>
          </form>
          </details>
          <form action={generateChecklistAction.bind(null, id)} className="card">
            <h2 className="font-semibold">Checklist sugerida</h2>
            <p className="mt-1 text-xs text-muted">Acrescenta as tarefas típicas de um {event.type === "WEDDING" ? "casamento" : event.type === "ENGAGEMENT" ? "noivado" : event.type === "BIRTHDAY" ? "aniversário" : "evento"} que ainda não tenha, com prazos calculados a partir da data.</p>
            <SubmitButton className="btn-secondary mt-3 w-full" pendingText="A completar…">Completar checklist</SubmitButton>
          </form>
          </>
          )}
        </div>
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Tarefas</h2>
            <div className="flex gap-1 text-xs">
              {[["", "Por fazer"], ["done", "Feitas"], ["all", "Todas"]].map(([v, l]) => (
                <a key={v} href={`?show=${v}`} className={`rounded-full px-3 py-1 ${(sp.show ?? "") === v ? "bg-brand-100 text-brand-700" : "text-muted hover:bg-brand-50"}`}>{l}</a>
              ))}
            </div>
          </div>
          {list.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted">{sp.show === "done" ? "Ainda não há tarefas concluídas." : "Nada por fazer."}</p>
          ) : (
            <ul className="mt-4 divide-y divide-brand-100">
              {list.map((t) => {
                const days = t.dueAt ? calendarDaysUntil(t.dueAt, event.timezone) : null;
                const late = !t.completedAt && days != null && days < 0;
                return (
                  <li key={t.id} className="flex items-start gap-3 py-3">
                    <form action={toggleTaskAction.bind(null, id, t.id)}>
                      <button className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${t.completedAt ? "border-brand-600 bg-brand-600 text-white" : "border-brand-300 hover:border-brand-500"}`} aria-label={t.completedAt ? "Marcar por fazer" : "Marcar feita"}>{t.completedAt ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}</button>
                    </form>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${t.completedAt ? "text-muted line-through" : "font-medium"}`}>{t.title}</p>
                      <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
                        {t.category && <span>{t.category}</span>}
                        {t.assignee && <span className="inline-flex items-center gap-1"><UserRound className="h-3 w-3" aria-hidden />{t.assignee}</span>}
                        {t.dueAt && (
                          <span className={late ? "font-semibold text-red-700" : ""}>
                            {formatEventDate(t.dueAt, false, event.timezone)}
                            {!t.completedAt && days != null && (days === 0 ? " · hoje" : days > 0 ? ` · em ${days} dias` : ` · atrasada ${-days} dias`)}
                          </span>
                        )}
                      </p>
                      {t.description && <p className="mt-1 text-xs text-muted">{t.description}</p>}
                    </div>
                    <form action={deleteTaskAction.bind(null, id, t.id)}><ConfirmButton className="text-muted hover:text-red-700" message={`Remover a tarefa "${t.title}"?`}><X className="h-4 w-4" aria-label="Remover tarefa" /></ConfirmButton></form>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
