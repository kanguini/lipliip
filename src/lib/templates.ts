export type TemplateMeta = {
  id: string;
  name: string;
  description: string;
  types: string[]; // tipos de evento em que se aplica
  colors: { bg: string; accent: string; text: string };
  fontHeading: string;
  fontBody: string;
};

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "classic",
    name: "Clássico Elegante",
    description: "Tipografia serifada, tons marfim e dourado. Ideal para casamentos tradicionais.",
    types: ["WEDDING", "ENGAGEMENT", "OTHER"],
    colors: { bg: "#fbf7f0", accent: "#b08d57", text: "#2b2118" },
    fontHeading: "'Playfair Display', Georgia, serif",
    fontBody: "'Inter', system-ui, sans-serif",
  },
  {
    id: "botanical",
    name: "Botânico",
    description: "Verdes suaves e folhagem, ambiente de jardim. Casamentos e noivados ao ar livre.",
    types: ["WEDDING", "ENGAGEMENT", "OTHER"],
    colors: { bg: "#f3f6ef", accent: "#4f6f52", text: "#22301f" },
    fontHeading: "'Cormorant Garamond', Georgia, serif",
    fontBody: "'Inter', system-ui, sans-serif",
  },
  {
    id: "modern",
    name: "Moderno Minimal",
    description: "Linhas limpas, muito espaço em branco e um toque de cor. Para noivados e festas urbanas.",
    types: ["WEDDING", "ENGAGEMENT", "BIRTHDAY", "OTHER"],
    colors: { bg: "#ffffff", accent: "#e0506b", text: "#111111" },
    fontHeading: "'Poppins', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
  },
  {
    id: "festive",
    name: "Festa Colorida",
    description: "Cores vivas, confetes e energia. Perfeito para aniversários.",
    types: ["BIRTHDAY", "OTHER"],
    colors: { bg: "#fff6e5", accent: "#ff6b35", text: "#2b1b0f" },
    fontHeading: "'Poppins', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
  },
  {
    id: "night",
    name: "Noite Dourada",
    description: "Fundo escuro com dourado. Festas de aniversário elegantes e noivados à noite.",
    types: ["BIRTHDAY", "ENGAGEMENT", "WEDDING", "OTHER"],
    colors: { bg: "#14121a", accent: "#e6c27a", text: "#f5f0e6" },
    fontHeading: "'Playfair Display', Georgia, serif",
    fontBody: "'Inter', system-ui, sans-serif",
  },
];

export function getTemplate(id: string): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export function templatesForType(type: string): TemplateMeta[] {
  return TEMPLATES.filter((t) => t.types.includes(type));
}
