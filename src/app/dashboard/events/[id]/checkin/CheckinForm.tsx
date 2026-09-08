"use client";

import { useCallback, useRef } from "react";
import { CheckinScanner } from "@/components/dashboard/CheckinScanner";

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
        <input ref={inputRef} name="code" className="input font-mono uppercase tracking-widest" placeholder="K7PM2Q" maxLength={8} autoFocus autoComplete="off" />
        <button className="btn-primary">Validar</button>
      </form>
      <CheckinScanner onCode={onCode} />
    </>
  );
}
