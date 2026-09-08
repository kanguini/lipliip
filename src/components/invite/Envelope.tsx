"use client";

import { useEffect, useState } from "react";

/** Ecrã de abertura: um "envelope" que o convidado toca para revelar o convite. */
export function Envelope({ hostNames, guestName, kicker, children }: { hostNames: string; guestName: string; kicker: string; children: React.ReactNode }) {
  const [opened, setOpened] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!opened) return;
    window.dispatchEvent(new CustomEvent("lipliip:open"));
    const t = setTimeout(() => setGone(true), 900);
    return () => clearTimeout(t);
  }, [opened]);

  if (gone) return <>{children}</>;

  return (
    <>
      <div className={opened ? "invite-envelope invite-envelope-open" : "invite-envelope"} onClick={() => setOpened(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setOpened(true)}>
        <div className="invite-envelope-card">
          <p className="text-xs uppercase tracking-[0.35em] opacity-70">{kicker}</p>
          <p className="invite-heading invite-accent mt-3 text-4xl">{hostNames}</p>
          <div className="invite-divider" />
          <p className="text-sm">Para <strong>{guestName}</strong></p>
          <span className="invite-btn mt-6">{opened ? "A abrir…" : "Abrir convite"}</span>
        </div>
        <div className="invite-envelope-flap" />
      </div>
      <div className={opened ? "" : "hidden"}>{children}</div>
    </>
  );
}
