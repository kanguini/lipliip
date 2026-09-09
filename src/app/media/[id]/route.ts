import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Serve um ficheiro guardado na base de dados. Os ids são cuid (imprevisíveis) e as fotografias
 * fazem parte de convites já protegidos pelo link pessoal; os comprovativos (DOCUMENT) só saem para
 * quem os pode ver (administrador ou o próprio autor) nas páginas respetivas.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const media = await db.media.findUnique({ where: { id } });
  if (!media) return new NextResponse("Not found", { status: 404 });
  // Fotografias escondidas pelos anfitriões deixam de ser servidas (o registo EventPhoto continua a existir).
  const hidden = await db.eventPhoto.findFirst({ where: { mediaId: id, hiddenAt: { not: null } }, select: { id: true } });
  if (hidden) return new NextResponse("Not found", { status: 404 });
  if (media.kind === "DOCUMENT") {
    // Comprovativos: só o administrador ou o dono do pedido.
    const { getCurrentUser } = await import("@/lib/auth");
    const { isAdmin } = await import("@/lib/admin");
    const user = await getCurrentUser();
    if (!user || (!isAdmin(user) && media.userId !== user.id)) return new NextResponse("Forbidden", { status: 403 });
  }
  return new NextResponse(new Uint8Array(media.data), {
    headers: {
      "Content-Type": media.mime,
      "Content-Length": String(media.size),
      "Cache-Control": media.kind === "DOCUMENT" ? "private, no-store" : "public, max-age=31536000, immutable",
      "Content-Disposition": media.kind === "DOCUMENT" ? "inline" : "inline",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
