import { db } from "@/lib/db";
import { requireOwnedEvent } from "@/lib/auth";
import { assignTableAction } from "@/app/dashboard/actions";

export default async function TablesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireOwnedEvent(id);
  const guests = await db.guest.findMany({ where: { eventId: id, rsvpStatus: { not: "DECLINED" } }, orderBy: [{ tableNumber: "asc" }, { name: "asc" }] });
  const tables = new Map<string, typeof guests>();
  for (const g of guests) {
    const key = g.tableNumber ?? "";
    tables.set(key, [...(tables.get(key) ?? []), g]);
  }
  const unassigned = tables.get("") ?? [];
  const assigned = [...tables.entries()].filter(([k]) => k !== "").sort(([a], [b]) => a.localeCompare(b, "pt", { numeric: true }));
  const seats = (list: typeof guests) => list.reduce((s, g) => s + 1 + (g.rsvpStatus === "ACCEPTED" ? g.companions : 0), 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
      <div className="card">
        <h2 className="font-semibold">Sem mesa ({unassigned.length})</h2>
        <p className="mt-1 text-xs text-stone-500">Escreva o número ou nome da mesa e carregue Enter. Convidados que disseram que não vão não aparecem aqui.</p>
        <ul className="mt-3 divide-y divide-stone-100 text-sm">
          {unassigned.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-2 py-2">
              <span>{g.name}{g.rsvpStatus === "ACCEPTED" && g.companions > 0 ? <span className="text-stone-500"> +{g.companions}</span> : null}{g.rsvpStatus === "PENDING" && <span className="ml-1 text-xs text-amber-700">(sem resposta)</span>}</span>
              <form action={assignTableAction.bind(null, id)}>
                <input type="hidden" name="guestId" value={g.id} />
                <input name="tableNumber" className="input w-24 py-1 text-xs" placeholder="Mesa" list="table-names" />
              </form>
            </li>
          ))}
          {unassigned.length === 0 && <li className="py-2 text-stone-500">Todos têm mesa.</li>}
        </ul>
        <datalist id="table-names">{assigned.map(([k]) => <option key={k} value={k} />)}</datalist>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {assigned.length === 0 && <p className="card text-sm text-stone-500">Ainda não há mesas atribuídas.</p>}
        {assigned.map(([table, list]) => (
          <div key={table} className="card">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold">Mesa {table}</h3>
              <span className="text-xs text-stone-500">{seats(list)} lugares</span>
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {list.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-2">
                  <span>{g.name}{g.rsvpStatus === "ACCEPTED" && g.companions > 0 ? <span className="text-stone-500"> +{g.companions}</span> : null}</span>
                  <form action={assignTableAction.bind(null, id)}>
                    <input type="hidden" name="guestId" value={g.id} />
                    <input type="hidden" name="tableNumber" value="" />
                    <button className="text-xs text-stone-400 hover:text-red-700" title="Tirar da mesa">✕</button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
