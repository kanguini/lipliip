"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Detector = { detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]> };
declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => Detector;
  }
}

/** Leitor de QR com a câmara (usa a API BarcodeDetector quando existe). Ao ler, submete o código. */
export function CheckinScanner({ onCode }: { onCode: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setSupported(typeof window !== "undefined" && !!window.BarcodeDetector);
  }, []);

  useEffect(() => {
    if (!active || !videoRef.current || !window.BarcodeDetector) return;
    let stream: MediaStream | null = null;
    let stop = false;
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    const video = videoRef.current;
    const lastRead = { value: "", at: 0 };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
        await video.play();
        const loop = async () => {
          if (stop) return;
          try {
            const codes = await detector.detect(video);
            const value = codes[0]?.rawValue;
            if (value && (value !== lastRead.value || Date.now() - lastRead.at > 4000)) {
              lastRead.value = value;
              lastRead.at = Date.now();
              onCode(value);
              router.refresh();
            }
          } catch {
            /* frame inválido */
          }
          setTimeout(loop, 250);
        };
        loop();
      } catch (e) {
        setError("Não foi possível aceder à câmara: " + (e as Error).message);
      }
    })();

    return () => {
      stop = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active, onCode, router]);

  if (supported === false) {
    return <p className="hint">O leitor de QR pela câmara não é suportado neste navegador (use Chrome/Edge no telemóvel). Introduza o código manualmente.</p>;
  }
  return (
    <div className="space-y-2">
      {active ? (
        <>
          <video ref={videoRef} className="w-full rounded-lg bg-black" muted playsInline />
          <button type="button" className="btn-secondary btn-sm" onClick={() => setActive(false)}>Parar câmara</button>
        </>
      ) : (
        <button type="button" className="btn-secondary" onClick={() => setActive(true)}>📷 Ler QR com a câmara</button>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
