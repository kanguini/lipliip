import { ResetForm } from "./ResetForm";

export const metadata = { title: "Nova palavra-passe" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="card w-full max-w-md text-center">
          <h1 className="font-display text-2xl">Link inválido ou expirado</h1>
          <p className="mt-2 text-sm text-muted">Peça um novo link de recuperação para definir a palavra-passe.</p>
          <a href="/forgot" className="btn-primary mt-4">Pedir novo link</a>
        </div>
      </main>
    );
  }
  return <ResetForm token={token} />;
}
