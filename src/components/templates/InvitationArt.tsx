import type { CSSProperties } from "react";
import { getTemplate } from "@/lib/templates";

export type ArtProps = {
  templateId: string;
  kicker: string; // "Casamento", "Vamos casar", ...
  names: string; // "Sofia & Miguel"
  dateLabel: string; // "12 de dezembro de 2026"
  placeLabel?: string; // "Quinta da Serra · 16:00"
  caption?: string;
  coverImageUrl?: string | null;
  small?: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * Cartaz do convite (4:5). A tipografia escala com a largura do contentor (unidades cqw),
 * por isso o mesmo componente serve para miniaturas, cartões e o cabeçalho do convite.
 */
export function InvitationArt({ templateId, kicker, names, dateLabel, placeLabel, caption, coverImageUrl, small = false, className = "", style }: ArtProps) {
  const t = getTemplate(templateId);
  const parts = names.split(/\s*&\s*|\s+e\s+/i).map((p) => p.trim()).filter(Boolean);
  const long = names.length > 45;
  const cover = coverImageUrl || (templateId === "rubi" ? "/images/rubi.jpg" : null);

  return (
    <div className={`invitation-art art-${t.id} ${small ? "art-small" : ""} ${cover && templateId !== "rubi" ? "art-has-cover" : ""} ${className}`} style={style}>
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="floral-art" />
      )}
      <div className="art-content">
        <p className="art-eyebrow">{kicker}</p>
        {t.id === "editorial" && <div className="art-statement">Sim.</div>}
        {t.id === "festa" && <div className="art-statement">VIVA!</div>}
        {t.id === "encontro" && <p className="art-script">o nosso sim</p>}
        <h3 className="art-names" style={long ? { fontSize: "7cqw", lineHeight: 1.15 } : undefined}>
          {parts.length === 2 ? (
            <>
              {parts[0]}
              <em>&amp;</em>
              {parts[1]}
            </>
          ) : (
            names
          )}
        </h3>
        <div className="art-rule" />
        <p className="art-date">{dateLabel}</p>
        {placeLabel && <p className="art-place">{placeLabel}</p>}
        {caption && <p className="art-caption">{caption}</p>}
      </div>
    </div>
  );
}
