export type TemplateMeta = {
  id: string;
  name: string;
  description: string;
  tag: string; // ex: "Romântico · Floral"
  collection: "2026" | "classic";
  types: string[]; // tipos de evento em que se aplica
  colors: { bg: string; accent: string; text: string };
  fontHeading: string;
  fontBody: string;
  /** Nomes e legenda de exemplo para as pré-visualizações. */
  sample: { names: string; caption: string };
  /**
   * Cartaz carregado (templates personalizados da administração): serve de fundo do convite,
   * com o texto sobreposto por cima. Os templates do catálogo fixo não o têm.
   */
  image?: string;
  /** Verdadeiro nos templates personalizados (carregados na administração), falso no catálogo fixo. */
  custom?: boolean;
};

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "'Inter', system-ui, sans-serif";
const CORMORANT = "'Cormorant Garamond', Georgia, serif";
const POPPINS = "'Poppins', system-ui, sans-serif";

export const TEMPLATES: TemplateMeta[] = [
  // ---- Colecção 2026: cartazes 4:5 com tipografia que escala com o ecrã
  {
    id: "rubi",
    name: "Rubi",
    description: "Bordeaux profundo com flores escuras e tipografia serifada. Romântico e intemporal.",
    tag: "Romântico · Floral",
    collection: "2026",
    types: ["WEDDING", "ENGAGEMENT", "OTHER"],
    colors: { bg: "#fbf5f7", accent: "#541b38", text: "#30262e" },
    fontHeading: SERIF,
    fontBody: SANS,
    sample: { names: "Sofia & Miguel", caption: "Uma vida inteira começa aqui." },
  },
  {
    id: "editorial",
    name: "Sim, para sempre",
    description: "Verde-sálvia com um grande \"Sim.\" tipográfico. Contemporâneo e sem excessos.",
    tag: "Contemporâneo · Tipográfico",
    collection: "2026",
    types: ["WEDDING", "ENGAGEMENT", "OTHER"],
    colors: { bg: "#f4f6ea", accent: "#364126", text: "#22301f" },
    fontHeading: SERIF,
    fontBody: SANS,
    sample: { names: "Carolina & Pedro", caption: "O nosso melhor capítulo." },
  },
  {
    id: "azul",
    name: "Primeiro capítulo",
    description: "Azul-pó com moldura fina. Clássico, sereno, para noivados e casamentos de dia.",
    tag: "Clássico · Intemporal",
    collection: "2026",
    types: ["ENGAGEMENT", "WEDDING", "OTHER"],
    colors: { bg: "#eef3f8", accent: "#213e61", text: "#1f2b3a" },
    fontHeading: SERIF,
    fontBody: SANS,
    sample: { names: "Isabel & André", caption: "O início de tudo." },
  },
  {
    id: "festa",
    name: "A vida é uma festa",
    description: "Laranja vibrante e um \"VIVA!\" inclinado. Energia pura para aniversários.",
    tag: "Vibrante · Divertido",
    collection: "2026",
    types: ["BIRTHDAY", "OTHER"],
    colors: { bg: "#fff3ee", accent: "#c8431f", text: "#3b1a10" },
    fontHeading: POPPINS,
    fontBody: SANS,
    sample: { names: "Os 30 da Beatriz", caption: "Vamos celebrar!" },
  },
  {
    id: "noite",
    name: "Depois do pôr do sol",
    description: "Ameixa escura com dourado e moldura. Elegante, para festas à noite.",
    tag: "Elegante · Nocturno",
    collection: "2026",
    types: ["BIRTHDAY", "ENGAGEMENT", "WEDDING", "OTHER"],
    colors: { bg: "#1c1622", accent: "#e8cf9e", text: "#f1e6d0" },
    fontHeading: SERIF,
    fontBody: SANS,
    sample: { names: "Os 40 do Daniel", caption: "Uma noite para recordar." },
  },
  {
    id: "encontro",
    name: "Nosso encontro",
    description: "Lilás suave com uma frase manuscrita. Moderno e delicado.",
    tag: "Moderno · Delicado",
    collection: "2026",
    types: ["ENGAGEMENT", "WEDDING", "BIRTHDAY", "OTHER"],
    colors: { bg: "#f2f1fb", accent: "#474070", text: "#2c2848" },
    fontHeading: SANS,
    fontBody: SANS,
    sample: { names: "Luísa & Afonso", caption: "Juntos é o nosso lugar." },
  },
  // ---- Clássicos
  {
    id: "classic",
    name: "Clássico Elegante",
    description: "Tipografia serifada, tons marfim e dourado. Ideal para casamentos tradicionais.",
    tag: "Clássico · Dourado",
    collection: "classic",
    types: ["WEDDING", "ENGAGEMENT", "OTHER"],
    colors: { bg: "#fbf7f0", accent: "#b08d57", text: "#2b2118" },
    fontHeading: SERIF,
    fontBody: SANS,
    sample: { names: "Ana & João", caption: "Com todo o amor." },
  },
  {
    id: "botanical",
    name: "Botânico",
    description: "Verdes suaves e folhagem, ambiente de jardim. Casamentos e noivados ao ar livre.",
    tag: "Natural · Jardim",
    collection: "classic",
    types: ["WEDDING", "ENGAGEMENT", "OTHER"],
    colors: { bg: "#f3f6ef", accent: "#4f6f52", text: "#22301f" },
    fontHeading: CORMORANT,
    fontBody: SANS,
    sample: { names: "Marta & Rui", caption: "Entre flores e amigos." },
  },
  {
    id: "modern",
    name: "Moderno Minimal",
    description: "Linhas limpas, muito espaço em branco e um toque de cor.",
    tag: "Minimal · Urbano",
    collection: "classic",
    types: ["WEDDING", "ENGAGEMENT", "BIRTHDAY", "OTHER"],
    colors: { bg: "#ffffff", accent: "#e0506b", text: "#111111" },
    fontHeading: POPPINS,
    fontBody: SANS,
    sample: { names: "Sofia & Miguel", caption: "Dissemos que sim." },
  },
  {
    id: "festive",
    name: "Festa Colorida",
    description: "Cores vivas, confetes e energia. Perfeito para aniversários.",
    tag: "Alegre · Confetes",
    collection: "classic",
    types: ["BIRTHDAY", "OTHER"],
    colors: { bg: "#fff6e5", accent: "#ff6b35", text: "#2b1b0f" },
    fontHeading: POPPINS,
    fontBody: SANS,
    sample: { names: "Maria faz 30!", caption: "Conto contigo." },
  },
  {
    id: "night",
    name: "Noite Dourada",
    description: "Fundo escuro com dourado. Aniversários elegantes e noivados à noite.",
    tag: "Escuro · Dourado",
    collection: "classic",
    types: ["BIRTHDAY", "ENGAGEMENT", "WEDDING", "OTHER"],
    colors: { bg: "#14121a", accent: "#e6c27a", text: "#f5f0e6" },
    fontHeading: SERIF,
    fontBody: SANS,
    sample: { names: "Os 50 do Carlos", caption: "Uma noite para recordar." },
  },
];

export const DEFAULT_TEMPLATE_ID = "rubi";

/** Templates da colecção 2026 são desenhados como "cartaz" (InvitationArt). */
export const POSTER_TEMPLATE_IDS = new Set(TEMPLATES.filter((t) => t.collection === "2026").map((t) => t.id));

export function getTemplate(id: string): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export function templatesForType(type: string): TemplateMeta[] {
  return TEMPLATES.filter((t) => t.types.includes(type));
}
