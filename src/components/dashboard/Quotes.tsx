"use client";

import { useEffect, useState } from "react";

/** Frases curtas sobre celebrar, amar e reunir. Escritas para o Liplip (sem autores). */
const QUOTES = [
  "As pessoas certas. O seu momento.",
  "Uma festa começa muito antes da primeira dança.",
  "Os momentos passam. Os laços ficam.",
  "Reunir quem amamos é a forma mais bonita de dizer obrigado.",
  "Cada convite é um abraço enviado antes do encontro.",
  "Há datas que não se marcam no calendário: marcam-se no coração.",
  "O amor celebra-se em boa companhia.",
  "Uma mesa cheia, um coração cheio.",
  "Os grandes dias fazem-se de pequenos gestos.",
  "Celebrar é lembrar, juntos, o que importa.",
];

const INTERVAL_MS = 8000;
const FADE_MS = 700;

/**
 * Pensamento de fecho da barra lateral: alterna entre frases com um fade suave a cada 8 segundos.
 * Com "prefers-reduced-motion" fica na primeira frase, sem animação.
 */
export function Quotes() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let fade: ReturnType<typeof setTimeout> | undefined;
    const timer = setInterval(() => {
      setVisible(false);
      fade = setTimeout(() => {
        setIndex((i) => (i + 1) % QUOTES.length);
        setVisible(true);
      }, FADE_MS);
    }, INTERVAL_MS);
    return () => {
      clearInterval(timer);
      if (fade) clearTimeout(fade);
    };
  }, []);

  return (
    <figure className="mx-6 mb-2 rounded-3xl bg-brand-50 px-5 py-5" aria-live="polite">
      <span className="block h-0.5 w-8 rounded-full bg-joy-coral" aria-hidden />
      <blockquote
        className="font-display mt-3 min-h-[3.5rem] text-[1.05rem] leading-snug text-brand-700 motion-safe:transition-opacity motion-safe:duration-700"
        style={{ opacity: visible ? 1 : 0, fontVariationSettings: '"opsz" 48, "SOFT" 80' }}
      >
        {QUOTES[index]}
      </blockquote>
    </figure>
  );
}
