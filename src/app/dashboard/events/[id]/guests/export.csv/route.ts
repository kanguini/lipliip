import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { editableEventWhere } from "@/lib/access";
import { RSVP_LABELS } from "@/lib/event-types";
import { csvCell as cell, csvPhoneCell as phoneCell } from "@/lib/csv";

export const dynamic = "force-dynamic";



/** Exporta a lista de convidados em CSV (separador ;, abre diretamente no Excel em PT). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const event = await db.event.findFirst({ where: { id, ...editableEventWhere(user.id) } });
  // A receção (STAFF) não exporta dados pessoais.
  if (!event) return new Response("Not found", { status: 404 });
  const guests = await db.guest.findMany({ where: { eventId: id }, orderBy: [{ groupName: "asc" }, { name: "asc" }] });

  const header = ["Nome", "Telefone", "Email", "Grupo", "Mesa", "Resposta", "Acompanhantes", "Nomes acompanhantes", "Restrições alimentares", "Música pedida", "Mensagem", "Enviado", "Aberto", "Validado", "Entrou", "Código entrada"];
  const rows = guests.map((g) => [
    g.name, phoneCell(g.phone), g.email, g.groupName, g.tableNumber, g.suspendedAt ? "Suspenso" : (RSVP_LABELS[g.rsvpStatus] ?? g.rsvpStatus),
    g.rsvpStatus === "ACCEPTED" ? g.companions : 0, g.companionNames, g.dietaryNotes, g.songRequest, g.rsvpMessage,
    g.sentAt ? "sim" : "não", g.firstOpenedAt ? "sim" : "não", g.verifiedAt ? "sim" : "não", g.checkedInAt ? "sim" : "não", g.checkinCode,
  ]);
  const csv = "\uFEFF" + [header.map(cell).join(";"), ...rows.map((r) => r.map((v, i) => (i === 1 ? String(v) : cell(v))).join(";"))].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="convidados-${event.id}.csv"`,
    },
  });
}
