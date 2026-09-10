"use client";

import { useCallback, useRef } from "react";
import { CheckinScanner } from "@/components/dashboard/CheckinScanner";
import { SubmitButton } from "@/components/dashboard/SubmitButton";

export function CheckinForm({ action }: { action: (fd: FormData) => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onCode = useCallback((code: string) => {
    if (inputRef.current && formRef.current) {
      inputRef.current.value = code;
      formRef.current.requestSubmit();
    }
  }, []);
  return (
    <>
      <form ref={formRef} action={action} className="flex gap-2">
        <label htmlFor="checkin-code" className="sr-only">Código do bilhete</label>
        <input id="checkin-code" ref={inputRef} name="code" className="input font-mono uppercase tracking-widest" placeholder="K7PM2Q" maxLength={8} autoFocus autoComplete="off" />
        <SubmitButton pendingText="A validar…">Validar</SubmitButton>
      </form>
      <CheckinScanner onCode={onCode} />
    </>
  );
}
