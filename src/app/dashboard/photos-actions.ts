"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireEventAccess } from "@/lib/access";
import { flash, bool } from "@/lib/form";
import { checkUpload, deleteMedia, saveImage } from "@/lib/media";

/** Fotografias do evento: álbum dos anfitriões (ALBUM) e moderação dos momentos dos convidados (LIVE). */

const MAX_ALBUM_PER_SUBMIT = 8; // 8 × 12 MB cabe no limite das Server Actions (60 MB)
const MAX_ALBUM_PHOTOS = 200;

export async function uploadAlbumPhotosAction(eventId: string, fd: FormData) {
  const { user } = await requireEventAccess(eventId);
  const path = `/dashboard/events/${eventId}/photos`;
  const files = fd.getAll("photos").filter((f) => f instanceof File && f.size > 0);
  if (files.length === 0) flash(path, "error", "Escolha pelo menos uma fotografia.");
  if (files.length > MAX_ALBUM_PER_SUBMIT) flash(path, "error", `Envie no máximo ${MAX_ALBUM_PER_SUBMIT} fotografias de cada vez.`);
  const existing = await db.eventPhoto.count({ where: { eventId, kind: "ALBUM" } });
  if (existing + files.length > MAX_ALBUM_PHOTOS) flash(path, "error", `O álbum pode ter no máximo ${MAX_ALBUM_PHOTOS} fotografias (tem ${existing}).`);
  let added = 0;
  const problems: string[] = [];
  for (const file of files) {
    const check = checkUpload(file, "image");
    if (!check.ok) {
      problems.push(`${(file as File).name}: ${check.error}`);
      continue;
    }
    try {
      const media = await saveImage(Buffer.from(await check.file.arrayBuffer()), { eventId, userId: user.id, maxSide: 1600 });
      await db.eventPhoto.create({ data: { eventId, mediaId: media.id, kind: "ALBUM" } });
      added++;
    } catch {
      problems.push(`${check.file.name}: não foi possível processar a imagem.`);
    }
  }
  revalidatePath(path);
  const summary = `${added} fotografia(s) adicionada(s) ao álbum.` + (problems.length ? ` Ignoradas: ${problems.slice(0, 5).join("; ")}${problems.length > 5 ? "…" : ""}` : "");
  flash(path, added === 0 ? "error" : "ok", summary);
}

export async function deleteEventPhotoAction(eventId: string, photoId: string) {
  await requireEventAccess(eventId);
  const path = `/dashboard/events/${eventId}/photos`;
  const photo = await db.eventPhoto.findFirst({ where: { id: photoId, eventId }, select: { id: true, mediaId: true } });
  if (!photo) flash(path, "error", "Fotografia não encontrada.");
  // Apagar o ficheiro remove a fotografia em cascata.
  await deleteMedia(photo.mediaId);
  revalidatePath(path);
  flash(path, "ok", "Fotografia apagada.");
}

export async function toggleHidePhotoAction(eventId: string, photoId: string) {
  await requireEventAccess(eventId);
  const path = `/dashboard/events/${eventId}/photos`;
  const photo = await db.eventPhoto.findFirst({ where: { id: photoId, eventId }, select: { id: true, hiddenAt: true } });
  if (!photo) flash(path, "error", "Fotografia não encontrada.");
  await db.eventPhoto.update({ where: { id: photo.id }, data: { hiddenAt: photo.hiddenAt ? null : new Date() } });
  revalidatePath(path);
  flash(path, "ok", photo.hiddenAt ? "Fotografia visível de novo no convite." : "Fotografia escondida do convite.");
}

export async function setLiveGalleryEnabledAction(eventId: string, fd: FormData) {
  await requireEventAccess(eventId);
  const path = `/dashboard/events/${eventId}/photos`;
  const enabled = bool(fd, "liveGalleryEnabled");
  await db.event.update({ where: { id: eventId }, data: { liveGalleryEnabled: enabled } });
  revalidatePath(path);
  flash(path, "ok", enabled ? "Momentos ativados: os convidados podem partilhar fotografias no convite." : "Momentos desativados: a galeria do dia deixa de aparecer no convite.");
}
