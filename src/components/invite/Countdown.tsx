"use client";

import { useEffect, useState } from "react";

function parts(target: number) {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    over: diff === 0,
  };
}

/** Contagem decrescente ao segundo até ao evento. */
export function Countdown({ date }: { date: string }) {
  const target = new Date(date).getTime();
  const [t, setT] = useState<ReturnType<typeof parts> | null>(null);
  useEffect(() => {
    setT(parts(target));
    const id = setInterval(() => setT(parts(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!t) return <div className="h-16" />;
  if (t.over) return <p className="invite-accent text-center text-xl font-semibold">É hoje!</p>;
  const cells = [
    [t.days, "dias"],
    [t.hours, "horas"],
    [t.minutes, "min"],
    [t.seconds, "seg"],
  ] as const;
  return (
    <div className="flex justify-center gap-3">
      {cells.map(([v, l]) => (
        <div key={l} className="min-w-14 rounded-xl px-2 py-2 text-center" style={{ background: "color-mix(in srgb, var(--inv-accent) 12%, transparent)" }}>
          <div className="invite-heading text-2xl font-semibold leading-none">{String(v).padStart(2, "0")}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wider opacity-70">{l}</div>
        </div>
      ))}
    </div>
  );
}
