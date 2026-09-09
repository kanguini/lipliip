"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { checkUpload, deleteMedia, saveImage } from "@/lib/media";
import { httpUrlOrNull } from "@/lib/validation";
import { flash, bool, opt, str } from "@/lib/form";
import { isAngolaProvince, isSupplierCategory, parseCoordinate } from "@/lib/suppliers";

const LIST = "/admin/suppliers";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REQUEST_STATUSES = new Set(["NEW", "CONTACTED", "CLOSED"]);

function supplierDataFromForm(fd: FormData) {
  const name = str(fd, "name", 120);
  if (name.length < 2) return { error: "Indique o nome do fornecedor." } as const;
  const category = str(fd, "category", 30);
  if (!isSupplierCategory(category)) return { error: "Categoria inválida." } as const;
  const provinceRaw = str(fd, "province", 40);
  if (provinceRaw && !isAngolaProvince(provinceRaw)) return { error: "Província inválida." } as const;
  const email = opt(fd, "email", 120);
  if (email && !EMAIL.test(email)) return { error: "Email inválido." } as const;
  const websiteRaw = str(fd, "website", 300);
  const website = httpUrlOrNull(websiteRaw.startsWith("http") || !websiteRaw ? websiteRaw : `https://${websiteRaw}`);
  if (websiteRaw && !website) return { error: "Site inválido. Use um endereço http(s)." } as const;
  const lat = parseCoordinate(str(fd, "lat", 30), "lat");
  const lng = parseCoordinate(str(fd, "lng", 30), "lng");
  if (lat === undefined || lng === undefined) return { error: "Coordenadas inválidas. Use por exemplo -8.838 e 13.234." } as const;
  if ((lat === null) !== (lng === null)) return { error: "Indique latitude e longitude, ou nenhuma." } as const;
  return {
    data: {
      name,
      category,
      city: opt(fd, "city", 80),
      province: provinceRaw || null,
      address: opt(fd, "address", 200),
      lat,
      lng,
      phone: opt(fd, "phone", 30),
      whatsapp: opt(fd, "whatsapp", 30),
      email,
      website,
      description: opt(fd, "description", 3000),
      featured: bool(fd, "featured"),
      active: bool(fd, "active"),
    },
  } as const;
}

/** Fotografia opcional do formulário: devolve o id do Media guardado, null se não veio nada, ou erro. */
async function imageFromForm(fd: FormData): Promise<{ id: string | null } | { error: string }> {
  const file = fd.get("image");
  if (!(file instanceof File) || file.size === 0) return { id: null };
  const check = checkUpload(file, "image");
  if (!check.ok) return { error: check.error };
  try {
    const media = await saveImage(Buffer.from(await check.file.arrayBuffer()), { maxSide: 1200 });
    return { id: media.id };
  } catch {
    return { error: "Não foi possível processar a imagem." };
  }
}

export async function createSupplierAction(fd: FormData) {
  await requireAdmin();
  const parsed = supplierDataFromForm(fd);
  if (parsed.error !== undefined) flash(`${LIST}/new`, "error", parsed.error);
  const image = await imageFromForm(fd);
  if ("error" in image) flash(`${LIST}/new`, "error", image.error);
  const supplier = await db.supplier.create({ data: { ...parsed.data, imageMediaId: image.id }, select: { id: true } });
  revalidatePath("/fornecedores");
  flash(`${LIST}/${supplier.id}`, "ok", "Fornecedor criado.");
}

export async function updateSupplierAction(supplierId: string, fd: FormData) {
  await requireAdmin();
  const path = `${LIST}/${supplierId}`;
  const existing = await db.supplier.findUnique({ where: { id: supplierId }, select: { id: true, imageMediaId: true } });
  if (!existing) flash(LIST, "error", "Fornecedor não encontrado.");
  const parsed = supplierDataFromForm(fd);
  if (parsed.error !== undefined) flash(path, "error", parsed.error);
  const image = await imageFromForm(fd);
  if ("error" in image) flash(path, "error", image.error);
  await db.supplier.update({ where: { id: supplierId }, data: { ...parsed.data, ...(image.id ? { imageMediaId: image.id } : {}) } });
  if (image.id && existing.imageMediaId) await deleteMedia(existing.imageMediaId);
  revalidatePath("/fornecedores");
  revalidatePath(`/fornecedores/${supplierId}`);
  flash(path, "ok", "Alterações guardadas.");
}

export async function removeSupplierImageAction(supplierId: string) {
  await requireAdmin();
  const existing = await db.supplier.findUnique({ where: { id: supplierId }, select: { imageMediaId: true } });
  if (existing?.imageMediaId) {
    await db.supplier.update({ where: { id: supplierId }, data: { imageMediaId: null } });
    await deleteMedia(existing.imageMediaId);
  }
  revalidatePath(`/fornecedores/${supplierId}`);
  flash(`${LIST}/${supplierId}`, "ok", "Imagem removida.");
}

/** Liga/desliga "em destaque" ou "ativo" a partir da lista. */
export async function toggleSupplierAction(supplierId: string, field: "featured" | "active", back: string) {
  await requireAdmin();
  const existing = await db.supplier.findUnique({ where: { id: supplierId }, select: { featured: true, active: true } });
  if (!existing) flash(LIST, "error", "Fornecedor não encontrado.");
  const next = !existing[field];
  await db.supplier.update({ where: { id: supplierId }, data: { [field]: next } });
  revalidatePath("/fornecedores");
  revalidatePath(`/fornecedores/${supplierId}`);
  const target = back.startsWith(LIST) ? back : LIST;
  flash(target, "ok", field === "featured" ? (next ? "Fornecedor em destaque." : "Destaque removido.") : next ? "Fornecedor publicado no diretório." : "Fornecedor escondido do diretório.");
}

export async function deleteSupplierAction(supplierId: string) {
  await requireAdmin();
  const existing = await db.supplier.findUnique({ where: { id: supplierId }, select: { imageMediaId: true } });
  if (!existing) flash(LIST, "error", "Fornecedor não encontrado.");
  await db.supplier.delete({ where: { id: supplierId } });
  if (existing.imageMediaId) await deleteMedia(existing.imageMediaId);
  revalidatePath("/fornecedores");
  flash(LIST, "ok", "Fornecedor eliminado.");
}

export async function setServiceRequestStatusAction(requestId: string, status: string, back: string) {
  await requireAdmin();
  const target = back.startsWith("/admin/service-requests") ? back : "/admin/service-requests";
  if (!REQUEST_STATUSES.has(status)) flash(target, "error", "Estado inválido.");
  const updated = await db.serviceRequest.updateMany({ where: { id: requestId }, data: { status } });
  if (updated.count === 0) flash(target, "error", "Pedido não encontrado.");
  flash(target, "ok", { NEW: "Pedido marcado como novo.", CONTACTED: "Pedido marcado como contactado.", CLOSED: "Pedido fechado." }[status] ?? "Estado atualizado.");
}
