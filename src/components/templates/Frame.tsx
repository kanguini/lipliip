import type { CSSProperties, ReactNode } from "react";
import { getTemplate } from "@/lib/templates";
import { luminance } from "@/lib/color";

/** Ajustes por template (fundos escuros precisam de cartões, inputs e botões diferentes). */
const EXTRA_VARS: Record<string, Record<string, string>> = {
  night: {
    "--inv-card": "rgba(255,255,255,0.06)",
    "--inv-input-bg": "rgba(255,255,255,0.08)",
    "--inv-input-text": "#f5f0e6",
  },
  noite: {
    "--inv-card": "rgba(255,255,255,0.06)",
    "--inv-input-bg": "rgba(255,255,255,0.08)",
    "--inv-input-text": "#f1e6d0",
  },
  festive: { "--inv-card": "rgba(255,255,255,0.9)" },
  modern: { "--inv-card": "#f7f7f7" },
};

/** Define as variáveis CSS do template (cores e fontes) e envolve todo o convite. */
export function TemplateFrame({
  templateId,
  accentColor,
  children,
  extraVars,
}: {
  templateId: string;
  accentColor?: string | null;
  children: ReactNode;
  extraVars?: Record<string, string>;
}) {
  const meta = getTemplate(templateId);
  const accent = accentColor || meta.colors.accent;
  const darkBg = luminance(meta.colors.bg) < 0.3;
  const style = {
    "--inv-bg": meta.colors.bg,
    "--inv-text": meta.colors.text,
    "--inv-accent": accent,
    // Texto sobre a cor de destaque: escuro se a cor for clara, para manter contraste (também com cores personalizadas).
    // Branco só atinge 4,5:1 sobre cores com luminância <= 0,18; acima disso o texto escuro contrasta melhor.
    "--inv-on-accent": luminance(accent) > 0.18 ? "#1a1a1a" : "#ffffff",
    "--inv-error": darkBg ? "#fca5a5" : "#b91c1c",
    "--inv-font-heading": meta.fontHeading,
    "--inv-font-body": meta.fontBody,
    ...EXTRA_VARS[templateId],
    ...extraVars,
  } as CSSProperties;
  return (
    <div className="invite-root min-h-screen" style={style}>
      {children}
    </div>
  );
}
