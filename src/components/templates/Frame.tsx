import type { CSSProperties, ReactNode } from "react";
import { getTemplate } from "@/lib/templates";

/** Ajustes por template (fundos escuros precisam de cartões, inputs e botões diferentes). */
const EXTRA_VARS: Record<string, Record<string, string>> = {
  night: {
    "--inv-card": "rgba(255,255,255,0.06)",
    "--inv-input-bg": "rgba(255,255,255,0.08)",
    "--inv-input-text": "#f5f0e6",
    "--inv-on-accent": "#14121a",
  },
  noite: {
    "--inv-card": "rgba(255,255,255,0.06)",
    "--inv-input-bg": "rgba(255,255,255,0.08)",
    "--inv-input-text": "#f1e6d0",
    "--inv-on-accent": "#1c1622",
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
  const style = {
    "--inv-bg": meta.colors.bg,
    "--inv-text": meta.colors.text,
    "--inv-accent": accentColor || meta.colors.accent,
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
