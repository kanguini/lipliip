import { FlatCompat } from "@eslint/eslintrc";

// eslint-config-next 15 ainda é publicado em formato eslintrc; o FlatCompat converte-o para flat config (ESLint 9).
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  { ignores: [".next/**", "node_modules/**", "public/**", "scripts/**", "prisma/migrations/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Parâmetros com prefixo "_" são intencionais (ex.: o FormData que o <form action> passa a ações com .bind).
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // As fontes são carregadas no layout raiz do App Router, que se aplica a todas as páginas.
      "@next/next/no-page-custom-font": "off",
    },
  },
];

export default config;
