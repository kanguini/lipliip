"use client";

import { useEffect, useRef, useState } from "react";

/** Botão flutuante para tocar/pausar a música de fundo do convite. */
export function MusicPlayer({ src, autoplay = false }: { src: string; autoplay?: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!autoplay) return;
    // Os browsers só permitem áudio depois de um gesto do utilizador: o toque no envelope serve de gatilho.
    const start = () => ref.current?.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    window.addEventListener("lipliip:open", start);
    return () => window.removeEventListener("lipliip:open", start);
  }, [autoplay]);

  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (a.paused) a.play().then(() => setPlaying(true)).catch(() => {});
    else {
      a.pause();
      setPlaying(false);
    }
  }

  return (
    <>
      <audio ref={ref} src={src} loop preload="none" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pausar música" : "Tocar música"}
        className="fixed bottom-4 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full shadow-lg"
        style={{ background: "var(--inv-accent)", color: "var(--inv-on-accent, #fff)" }}
      >
        <span className={playing ? "animate-pulse" : ""}>{playing ? "♫" : "▶"}</span>
      </button>
    </>
  );
}
