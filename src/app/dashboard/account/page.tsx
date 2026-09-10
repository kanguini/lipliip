import { requireUser } from "@/lib/auth";
import { FlashFromSearch, PageHeader } from "@/components/ui";
import { changePasswordAction, updateProfileAction } from "./actions";
import { SubmitButton } from "@/components/dashboard/SubmitButton";

export const metadata = { title: "A sua conta" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="A sua conta" subtitle={user.email} />
      <FlashFromSearch {...sp} />
      <div className="grid gap-6 lg:grid-cols-2">
        <form action={updateProfileAction} className="card space-y-3">
          <h2 className="font-semibold">Perfil</h2>
          <div><label className="label" htmlFor="ac-name">Nome</label><input id="ac-name" name="name" className="input" defaultValue={user.name} required autoComplete="name" /></div>
          <div><label className="label" htmlFor="ac-phone">Telemóvel (opcional)</label><input id="ac-phone" name="phone" className="input" inputMode="tel" autoComplete="tel" defaultValue={user.phone ?? ""} /></div>
          <SubmitButton>Guardar</SubmitButton>
        </form>
        <form action={changePasswordAction} className="card space-y-3">
          <h2 className="font-semibold">Alterar palavra-passe</h2>
          <div><label className="label" htmlFor="ac-current">Palavra-passe atual</label><input id="ac-current" name="current" type="password" className="input" required autoComplete="current-password" /></div>
          <div><label className="label" htmlFor="ac-next">Nova palavra-passe</label><input id="ac-next" name="next" type="password" className="input" required minLength={8} autoComplete="new-password" /></div>
          <p className="hint">Ao alterar, todas as sessões são terminadas e terá de entrar de novo.</p>
          <SubmitButton className="btn-secondary" pendingText="A alterar…">Alterar</SubmitButton>
        </form>
      </div>
    </>
  );
}
