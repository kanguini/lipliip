import { requireUser } from "@/lib/auth";
import { FlashFromSearch, PageHeader } from "@/components/ui";
import { changePasswordAction, updateProfileAction } from "./actions";

export const metadata = { title: "A minha conta" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="A minha conta" subtitle={user.email} />
      <FlashFromSearch {...sp} />
      <div className="grid gap-6 lg:grid-cols-2">
        <form action={updateProfileAction} className="card space-y-3">
          <h2 className="font-semibold">Perfil</h2>
          <div><label className="label">Nome</label><input name="name" className="input" defaultValue={user.name} required /></div>
          <div><label className="label">Telemóvel (opcional)</label><input name="phone" className="input" defaultValue={user.phone ?? ""} /></div>
          <button className="btn-primary">Guardar</button>
        </form>
        <form action={changePasswordAction} className="card space-y-3">
          <h2 className="font-semibold">Alterar palavra-passe</h2>
          <div><label className="label">Palavra-passe atual</label><input name="current" type="password" className="input" required autoComplete="current-password" /></div>
          <div><label className="label">Nova palavra-passe</label><input name="next" type="password" className="input" required minLength={8} autoComplete="new-password" /></div>
          <p className="hint">Ao alterar, todas as sessões são terminadas e terá de entrar de novo.</p>
          <button className="btn-secondary">Alterar</button>
        </form>
      </div>
    </>
  );
}
