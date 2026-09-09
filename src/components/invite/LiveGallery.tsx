"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, ChevronLeft, ChevronRight, Images, LoaderCircle, Trash2, X } from "lucide-react";
import { deleteGuestPhotoAction, uploadGuestPhotosAction } from "@/app/c/[token]/actions";

/**
 * Momentos: os convidados tiram fotografias a partir do convite e todas ficam numa galeria comum,
 * com lightbox simples (sem biblioteca) e a possibilidade de apagar as próprias fotografias.
 */
export type LivePhoto = { id: string; url: string; caption: string | null; by: string | null; mine: boolean; createdAt: Date };

const MAX_PER_SUBMIT = 10;
const CLIENT_MAX_SIDE = 1600;

/** Reduz a fotografia no próprio telemóvel (lado maior 1600 px, JPEG) para o envio ser rápido e caber no limite do servidor. */
async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, CLIENT_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1_500_000) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file; // formatos que o browser não descodifica (ex.: HEIC) seguem originais; o servidor trata-os
  }
}

function timeLabel(d: Date, tz?: string) {
  try {
    return new Intl.DateTimeFormat("pt-PT", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(new Date(d));
  } catch {
    return new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit" }).format(new Date(d));
  }
}

export function LiveGallery({ token, eventDate, photos, tz }: { token: string; eventDate: Date; photos: LivePhoto[]; tz?: string }) {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const [progress, setProgress] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [deleting, startDelete] = useTransition();
  const daysAway = Math.ceil((new Date(eventDate).getTime() - Date.now()) / 86_400_000);

  const upload = useCallback(
    (input: HTMLInputElement) => {
      const files = Array.from(input.files ?? []).slice(0, MAX_PER_SUBMIT);
      input.value = "";
      if (files.length === 0) return;
      setNotice(null);
      setProgress(`A enviar ${files.length} fotografia${files.length > 1 ? "s" : ""}…`);
      startUpload(async () => {
        const fd = new FormData();
        for (const f of files) fd.append("photos", await shrinkImage(f));
        let res;
        try {
          res = await uploadGuestPhotosAction(token, fd);
        } catch {
          res = { ok: false, added: 0, error: "Não foi possível enviar. Verifique a ligação e tente de novo." };
        }
        setProgress(null);
        if (res.ok) {
          setNotice({ kind: res.error ? "error" : "ok", text: `${res.added} fotografia${res.added > 1 ? "s" : ""} partilhada${res.added > 1 ? "s" : ""}.${res.error ? ` ${res.error}` : ""}` });
          router.refresh();
        } else {
          setNotice({ kind: "error", text: res.error ?? "Não foi possível enviar." });
        }
      });
    },
    [router, token],
  );

  const current = open != null ? photos[open] : null;
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((delta: number) => setOpen((i) => (i == null ? null : (i + delta + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    if (open == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, step]);

  useEffect(() => {
    if (open != null && open >= photos.length) setOpen(photos.length ? photos.length - 1 : null);
  }, [photos.length, open]);

  return (
    <section className="invite-card" id="momentos">
      <h2 className="text-2xl">Momentos</h2>
      <p className="mt-1 text-sm opacity-70">
        {daysAway > 1 ? "No dia da festa, tire fotografias a partir daqui: ficam todas numa galeria comum para todos verem." : "Tire fotografias e partilhe-as com todos os convidados. Aparecem aqui em segundos."}
      </p>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => upload(e.currentTarget)} />
      <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.currentTarget)} />
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="invite-btn" disabled={uploading} onClick={() => cameraRef.current?.click()}>
          {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden /> : <Camera className="h-4 w-4" strokeWidth={1.75} aria-hidden />}
          {uploading ? "A enviar…" : "Tirar fotografia"}
        </button>
        <button type="button" className="invite-btn-outline" disabled={uploading} onClick={() => galleryRef.current?.click()}>
          <Images className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          Escolher da galeria
        </button>
      </div>
      <p className="mt-2 text-xs opacity-60">Até {MAX_PER_SUBMIT} fotografias de cada vez. As fotografias ficam visíveis para todos os convidados; os anfitriões podem escondê-las.</p>
      {progress && (
        <p className="mt-2 flex items-center gap-2 text-sm" aria-live="polite">
          <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden />
          {progress}
        </p>
      )}
      {notice && <p className={`mt-2 text-sm ${notice.kind === "error" ? "invite-error" : "font-medium"}`} aria-live="polite">{notice.text}</p>}

      {photos.length > 0 ? (
        <div className="mt-4 columns-3 gap-1.5">
          {photos.map((p, i) => (
            <button key={p.id} type="button" className="mb-1.5 block w-full break-inside-avoid overflow-hidden rounded-lg" onClick={() => setOpen(i)} aria-label={`Abrir fotografia${p.by ? ` de ${p.by}` : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption ?? ""} className="w-full object-cover" loading="lazy" decoding="async" style={{ aspectRatio: i % 5 === 0 ? "3 / 4" : i % 3 === 1 ? "4 / 3" : "1 / 1" }} />
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm opacity-60">Ainda não há fotografias. Seja quem tira a primeira.</p>
      )}

      {current && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 text-white" role="dialog" aria-modal="true" aria-label="Fotografia" onClick={close}>
          <div className="flex items-center justify-between p-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm">
              {current.by ? `por ${current.by}` : "por um convidado"} · {timeLabel(current.createdAt, tz)}
            </p>
            <button type="button" className="rounded-full p-2 hover:bg-white/10" onClick={close} aria-label="Fechar">
              <X className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.url} alt={current.caption ?? ""} className="max-h-full max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
            {photos.length > 1 && (
              <>
                <button type="button" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 hover:bg-black/60" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label="Anterior">
                  <ChevronLeft className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                </button>
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 hover:bg-black/60" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label="Seguinte">
                  <ChevronRight className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                </button>
              </>
            )}
          </div>
          <div className="flex items-center justify-between p-3 text-xs" onClick={(e) => e.stopPropagation()}>
            <span className="opacity-70">{(open ?? 0) + 1} / {photos.length}</span>
            {current.mine && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 font-semibold hover:bg-white/20 disabled:opacity-50"
                disabled={deleting}
                onClick={() => {
                  if (!window.confirm("Apagar esta fotografia? Deixa de aparecer a todos os convidados.")) return;
                  startDelete(async () => {
                    const res = await deleteGuestPhotoAction(token, current.id);
                    if (res.ok) {
                      close();
                      router.refresh();
                    } else {
                      setNotice({ kind: "error", text: res.error ?? "Não foi possível apagar." });
                    }
                  });
                }}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                {deleting ? "A apagar…" : "Apagar"}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
