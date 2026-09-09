import sharp from "sharp";
import { db } from "./db";

/**
 * Armazenamento de ficheiros (fotografias e comprovativos).
 * Por agora os ficheiros ficam na base de dados, já redimensionados; a assinatura das funções
 * permite trocar por armazenamento S3 (bucket) sem mexer nas páginas.
 */

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // 12 MB por ficheiro antes de redimensionar
export const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif"]);
export const DOCUMENT_MIMES = new Set(["application/pdf", ...IMAGE_MIMES]);

/** O Prisma espera Uint8Array sobre ArrayBuffer (não SharedArrayBuffer). */
function toBytes(buf: Buffer): Uint8Array<ArrayBuffer> {
  return new Uint8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer);
}

export type SavedMedia = { id: string; mime: string; width: number | null; height: number | null; size: number };

/** Redimensiona (lado maior ≤ maxSide), remove metadados e guarda como JPEG/WebP. */
export async function saveImage(
  input: Buffer | Uint8Array,
  opts: { eventId?: string | null; userId?: string | null; maxSide?: number; quality?: number } = {},
): Promise<SavedMedia> {
  const maxSide = opts.maxSide ?? 1600;
  const pipeline = sharp(Buffer.from(input), { failOn: "none", limitInputPixels: 50_000_000 })
    .rotate() // aplica a orientação EXIF antes de a remover
    .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
    .webp({ quality: opts.quality ?? 80 });
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  const media = await db.media.create({
    data: { kind: "IMAGE", mime: "image/webp", size: data.length, width: info.width, height: info.height, data: toBytes(data), eventId: opts.eventId ?? null, userId: opts.userId ?? null },
    select: { id: true, mime: true, width: true, height: true, size: true },
  });
  return media;
}

/** Guarda um documento (PDF ou imagem de comprovativo) sem o alterar, com limite de tamanho. */
export async function saveDocument(input: Buffer | Uint8Array, mime: string, opts: { eventId?: string | null; userId?: string | null } = {}): Promise<SavedMedia> {
  if (IMAGE_MIMES.has(mime)) return saveImage(input, { ...opts, maxSide: 2000, quality: 85 });
  if (!DOCUMENT_MIMES.has(mime)) throw new Error("Formato não suportado. Envie PDF ou imagem.");
  const data = Buffer.from(input);
  if (data.length > 5 * 1024 * 1024) throw new Error("O ficheiro tem mais de 5 MB.");
  return db.media.create({
    data: { kind: "DOCUMENT", mime, size: data.length, data: toBytes(data), eventId: opts.eventId ?? null, userId: opts.userId ?? null },
    select: { id: true, mime: true, width: true, height: true, size: true },
  });
}

/** Valida um ficheiro vindo de um FormData antes de o processar. */
export function checkUpload(file: unknown, kind: "image" | "document"): { ok: true; file: File } | { ok: false; error: string } {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Escolha um ficheiro." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "O ficheiro tem mais de 12 MB." };
  const allowed = kind === "image" ? IMAGE_MIMES : DOCUMENT_MIMES;
  if (!allowed.has(file.type)) return { ok: false, error: kind === "image" ? "Envie uma fotografia (JPG, PNG, WebP ou HEIC)." : "Envie um PDF ou uma imagem." };
  return { ok: true, file };
}

/** URL público de um ficheiro guardado (servido por /media/[id]). */
export function mediaUrl(id: string) {
  return `/media/${id}`;
}

export async function deleteMedia(id: string) {
  await db.media.deleteMany({ where: { id } });
}
