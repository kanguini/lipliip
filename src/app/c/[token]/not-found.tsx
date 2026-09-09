import Link from "next/link";
import { MailX } from "lucide-react";

export default function InviteNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <MailX className="h-14 w-14 text-brand-400" strokeWidth={1.25} aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold">Convite inválido ou revogado</h1>
      <p className="mt-2 max-w-md text-sm text-stone-500">
        Este link já não está ativo. Se recebeu o convite de outra pessoa, saiba que os convites são pessoais e não podem ser
        transferidos. Contacte os anfitriões para receber o seu.
      </p>
      <Link href="/" className="btn-secondary mt-6">Ir para a página inicial</Link>
    </main>
  );
}
