"use client";

/** Botão de submissão que pede confirmação antes de enviar o formulário. */
export function ConfirmButton({ message, className = "btn-danger btn-sm", children }: { message: string; className?: string; children: React.ReactNode }) {
  return (
    <button
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
