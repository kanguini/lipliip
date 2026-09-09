import { db } from "@/lib/db";
import { requireEventAccess } from "@/lib/access";
import { checkinAction, toggleCheckinAction } from "@/app/dashboard/actions";
import { FlashFromSearch, StatCard } from "@/components/ui";
import { CheckinForm } from "./CheckinForm";
import { CheckCircle2 } from "lucide-react";

export default async function CheckinPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string; q?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  await requireEventAccess(id, { allowStaff: true });
  const guests = await db.guest.findMany({ where: { eventId: id }, orderBy: { name: "asc" } });
  const q = (sp.q ?? "").toLowerCase();
  const list = q ? guests.filter((g) => g.name.toLowerCase().includes(q) || g.checkinCode.toLowerCase().includes(q)) : guests;
  const accepted = guests.filter((g) => g.rsvpStatus === "ACCEPTED" && !g.suspendedAt);
  const arrived = guests.filter((g) => g.checkedInAt);
  const expected = accepted.reduce((s, g) => s + 1 + g.companions, 0);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Confirmados" value={accepted.length} />
        <StatCard label="Pessoas esperadas" value={expected} />
        <StatCard label="Já entraram" value={arrived.length} tone="good" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="card space-y-4">
          <h2 className="font-semibold">Validar entrada</h2>
          <p className="text-sm text-stone-500">Leia o QR do convite ou escreva o código de 6 caracteres que aparece no convite do convidado.</p>
          <FlashFromSearch {...sp} />
          <CheckinForm action={checkinAction.bind(null, id)} />
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Lista de convidados</h2>
            <form><input name="q" className="input w-44" placeholder="Nome ou código" aria-label="Pesquisar convidado" defaultValue={sp.q ?? ""} /></form>
          </div>
          <ul className="mt-3 divide-y divide-stone-100 text-sm">
            {list.map((g) => (
              <li key={g.id} className="flex items-center justify-between py-2">
                <div>
                  <span className={g.checkedInAt ? "inline-flex items-center gap-1 font-medium text-emerald-700" : "font-medium"}>{g.checkedInAt ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : null}{g.name}</span>
                  <span className="ml-2 font-mono text-xs text-stone-400">{g.checkinCode}</span>
                  <span className="ml-2 text-xs text-stone-500">
                    {g.rsvpStatus === "ACCEPTED" ? `confirmado${g.companions ? ` +${g.companions}` : ""}` : g.rsvpStatus === "DECLINED" ? "não vinha" : "sem resposta"}
                    {g.tableNumber ? ` · mesa ${g.tableNumber}` : ""}
                  </span>
                </div>
                <form action={toggleCheckinAction.bind(null, g.id)}>
                  <button className={g.checkedInAt ? "btn-ghost btn-sm" : "btn-secondary btn-sm"}>{g.checkedInAt ? "Anular" : "Entrou"}</button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
