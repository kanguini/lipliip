import { db } from "@/lib/db";
import { requireEventAccess } from "@/lib/access";
import { formatDateTimeShort } from "@/lib/format";
import { parseGallery } from "@/lib/event-types";
import { deleteEventPhotoAction, setLiveGalleryEnabledAction, toggleHidePhotoAction, uploadAlbumPhotosAction } from "@/app/dashboard/photos-actions";
import { FlashFromSearch } from "@/components/ui";
import { SubmitButton } from "@/components/dashboard/SubmitButton";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { Eye, EyeOff, ImagePlus, Trash2 } from "lucide-react";

export default async function PhotosPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { event } = await requireEventAccess(id);
  const [album, live] = await Promise.all([
    db.eventPhoto.findMany({ where: { eventId: id, kind: "ALBUM" }, select: { id: true, mediaId: true, hiddenAt: true, createdAt: true }, orderBy: { createdAt: "asc" } }),
    db.eventPhoto.findMany({ where: { eventId: id, kind: "LIVE" }, select: { id: true, mediaId: true, hiddenAt: true, createdAt: true, guest: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 500 }),
  ]);
  const urlGallery = parseGallery(event.galleryJson).length;
  const hiddenLive = live.filter((p) => p.hiddenAt).length;

  return (
    <>
      <FlashFromSearch {...sp} />
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <form action={uploadAlbumPhotosAction.bind(null, id)} className="card space-y-3">
            <h2 className="font-semibold">Álbum</h2>
            <p className="text-sm text-muted">Fotografias suas que aparecem na secção Galeria do convite{urlGallery ? `, a seguir aos ${urlGallery} link(s) definidos em Conteúdo` : ""}. São redimensionadas automaticamente.</p>
            <div>
              <label className="label" htmlFor="album-photos">Fotografias (até 20 de cada vez)</label>
              <input id="album-photos" name="photos" type="file" accept="image/*" multiple required className="input" />
              <p className="hint">JPG, PNG, WebP ou HEIC, até 12 MB cada.</p>
            </div>
            <SubmitButton className="btn-primary w-full" pendingText="A enviar…"><ImagePlus className="h-4 w-4" strokeWidth={1.75} aria-hidden />Adicionar ao álbum</SubmitButton>
          </form>
          <form action={setLiveGalleryEnabledAction.bind(null, id)} className="card space-y-3">
            <h2 className="font-semibold">Momentos dos convidados</h2>
            <p className="text-sm text-muted">No dia, os convidados tiram fotografias a partir do convite e todas ficam numa galeria comum. Pode esconder ou apagar qualquer uma.</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="liveGalleryEnabled" defaultChecked={event.liveGalleryEnabled} />
              Permitir que os convidados partilhem fotografias
            </label>
            <SubmitButton className="btn-secondary btn-sm" pendingText="A guardar…">Guardar</SubmitButton>
          </form>
        </div>
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold">Álbum ({album.length})</h2>
            {album.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Ainda não há fotografias no álbum. Adicione as suas fotografias preferidas: aparecem no convite de todos.</p>
            ) : (
              <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {album.map((p) => (
                  <li key={p.id} className="group relative overflow-hidden rounded-2xl bg-stone-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/media/${p.mediaId}`} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                    <form action={deleteEventPhotoAction.bind(null, id, p.id)} className="absolute right-1.5 top-1.5">
                      <ConfirmButton className="icon-circle h-8 w-8 bg-white/90 text-red-700 shadow-sm hover:bg-white" message="Apagar esta fotografia do álbum? Não é possível recuperar.">
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden /><span className="sr-only">Apagar</span>
                      </ConfirmButton>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card">
            <h2 className="font-semibold">Momentos dos convidados ({live.length}{hiddenLive ? `, ${hiddenLive} escondida(s)` : ""})</h2>
            {live.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Ainda não há fotografias dos convidados. Aparecem aqui assim que alguém partilhar uma a partir do convite.</p>
            ) : (
              <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {live.map((p) => (
                  <li key={p.id} className={`overflow-hidden rounded-2xl bg-stone-50 ${p.hiddenAt ? "opacity-60" : ""}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/media/${p.mediaId}`} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                    <div className="p-2 text-xs">
                      <p className="truncate font-medium">{p.guest?.name ?? "Convidado removido"}</p>
                      <p className="text-muted">{formatDateTimeShort(p.createdAt, event.timezone)}{p.hiddenAt ? " · escondida" : ""}</p>
                      <div className="mt-2 flex gap-1">
                        <form action={toggleHidePhotoAction.bind(null, id, p.id)}>
                          <SubmitButton className="btn-secondary btn-sm" pendingText="…">
                            {p.hiddenAt ? <><Eye className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />Mostrar</> : <><EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />Esconder</>}
                          </SubmitButton>
                        </form>
                        <form action={deleteEventPhotoAction.bind(null, id, p.id)}>
                          <ConfirmButton className="btn-danger btn-sm" message={`Apagar a fotografia de ${p.guest?.name ?? "convidado"}? Não é possível recuperar.`}>
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />Apagar
                          </ConfirmButton>
                        </form>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
