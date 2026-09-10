"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { checkUpload, deleteMedia, saveImage } from "@/lib/media";
import { flash, str, opt, bool } from "@/lib/form";
import { CUSTOM_TEMPLATE_TYPES } from "@/lib/custom-templates";

const LIST = "/admin/templates";
const HEX = /^#[0-9a-fA-F]{6}$/;

/** Lê e valida os campos do cartaz personalizado (sem a imagem, tratada à parte). */
function templateDataFromForm(fd: FormData) {
  const name = str(fd, "name", 120);
  if (name.length < 2) return { error: "Indique o nome do template." } as const;
  const types = fd.getAll("types").map((t) => String(t)).filter((t) => (CUSTOM_TEMPLATE_TYPES as readonly string[]).includes(t));
  if (types.length === 0) return { error: "Escolha pelo menos um tipo de evento." } as const;
  const accentColor = str(fd, "accentColor", 7);
  if (!HEX.test(accentColor)) return { error: "Cor de destaque inválida." } as const;
  const bgRaw = str(fd, "bgColor", 7);
  const textRaw = str(fd, "textColor", 7);
  return {
    data: {
      name,
      tag: opt(fd, "tag", 60) ?? "",
      description: opt(fd, "description", 400) ?? "",
      types,
      accentColor,
      bgColor: HEX.test(bgRaw) ? bgRaw : "#fbf5f7",
      textColor: HEX.test(textRaw) ? textRaw : "#30262e",
      sampleNames: opt(fd, "sampleNames", 60) ?? "Sofia & Miguel",
      sampleCaption: opt(fd, "sampleCaption", 120) ?? "Uma vida inteira começa aqui.",
      enabled: bool(fd, "enabled"),
      premium: bool(fd, "premium"),
      sortOrder: Number.parseInt(str(fd, "sortOrder", 5), 10) || 0,
    },
  } as const;
}

/** Imagem do cartaz: devolve o id do Media (grande, para servir de fundo), null se não veio, ou erro. */
async function posterFromForm(fd: FormData): Promise<{ id: string | null } | { error: string }> {
  const file = fd.get("image");
  if (!(file instanceof File) || file.size === 0) return { id: null };
  const check = checkUpload(file, "image");
  if (!check.ok) return { error: check.error };
  try {
    const media = await saveImage(Buffer.from(await check.file.arrayBuffer()), { maxSide: 1600 });
    return { id: media.id };
  } catch {
    return { error: "Não foi possível processar a imagem." };
  }
}

export async function createCustomTemplateAction(fd: FormData) {
  await requireAdmin();
  const back = `${LIST}/custom/new`;
  const parsed = templateDataFromForm(fd);
  if (parsed.error !== undefined) flash(back, "error", parsed.error);
  const poster = await posterFromForm(fd);
  if ("error" in poster) flash(back, "error", poster.error);
  if (!poster.id) flash(back, "error", "Carregue a imagem do cartaz.");
  await db.customTemplate.create({ data: { ...parsed.data, imageMediaId: poster.id } });
  revalidatePath(LIST);
  flash(LIST, "ok", "Template carregado.");
}

export async function updateCustomTemplateAction(id: string, fd: FormData) {
  await requireAdmin();
  const back = `${LIST}/custom/${id}`;
  const existing = await db.customTemplate.findUnique({ where: { id }, select: { id: true, imageMediaId: true } });
  if (!existing) flash(LIST, "error", "Template não encontrado.");
  const parsed = templateDataFromForm(fd);
  if (parsed.error !== undefined) flash(back, "error", parsed.error);
  const poster = await posterFromForm(fd);
  if ("error" in poster) flash(back, "error", poster.error);
  await db.customTemplate.update({ where: { id }, data: { ...parsed.data, ...(poster.id ? { imageMediaId: poster.id } : {}) } });
  if (poster.id && existing.imageMediaId) await deleteMedia(existing.imageMediaId);
  revalidatePath(LIST);
  revalidatePath(`/preview/${id}`);
  flash(back, "ok", "Alterações guardadas.");
}

export async function deleteCustomTemplateAction(id: string) {
  await requireAdmin();
  const existing = await db.customTemplate.findUnique({ where: { id }, select: { imageMediaId: true } });
  if (!existing) flash(LIST, "error", "Template não encontrado.");
  await db.customTemplate.delete({ where: { id } });
  if (existing.imageMediaId) await deleteMedia(existing.imageMediaId);
  revalidatePath(LIST);
  flash(LIST, "ok", "Template eliminado.");
}
