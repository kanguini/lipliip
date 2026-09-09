import type { MenuSection as MenuSectionData } from "@/lib/menu";

/** Ementa do evento (secções e pratos). Não mostra nada quando o evento não tem ementa. */
export function MenuSection({ menu }: { menu: MenuSectionData[] }) {
  if (menu.length === 0) return null;
  return (
    <section className="invite-card" id="ementa">
      <h2 className="text-2xl">Ementa</h2>
      <p className="mt-1 text-sm opacity-70">O que vamos servir. Se tiver restrições alimentares, indique-as na confirmação de presença.</p>
      <div className="mt-4 space-y-5">
        {menu.map((s, si) => (
          <div key={`${si}-${s.title}`}>
            <h3 className="invite-accent text-xs font-semibold uppercase tracking-[0.25em]">{s.title}</h3>
            <ul className="mt-2 space-y-2">
              {s.items.map((i, idx) => (
                <li key={idx} className="text-sm">
                  <span className="font-semibold">{i.name}</span>
                  {i.description && <span className="opacity-80"> · {i.description}</span>}
                  {i.tags && i.tags.length > 0 && (
                    <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
                      {i.tags.map((t, ti) => (
                        <span key={`${ti}-${t}`} className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide" style={{ background: "color-mix(in srgb, var(--inv-accent) 14%, transparent)" }}>{t}</span>
                      ))}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
