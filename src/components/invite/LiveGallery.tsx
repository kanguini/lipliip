"use client";

/**
 * Galeria do dia: os convidados tiram fotografias a partir do convite e todas ficam numa galeria comum.
 * (Ponto de montagem: a implementação completa — upload, câmara, moderação — chega na fase seguinte.)
 */
export type LivePhoto = { id: string; url: string; caption: string | null; by: string | null; mine: boolean; createdAt: Date };

export function LiveGallery({ photos }: { token: string; eventDate: Date; photos: LivePhoto[] }) {
  if (photos.length === 0) return null;
  return (
    <section className="invite-card" id="momentos">
      <h2 className="text-2xl">Momentos</h2>
      <div className="mt-3 grid grid-cols-3 gap-1">
        {photos.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.id} src={p.url} alt={p.caption ?? ""} className="aspect-square w-full rounded-lg object-cover" loading="lazy" />
        ))}
      </div>
    </section>
  );
}
