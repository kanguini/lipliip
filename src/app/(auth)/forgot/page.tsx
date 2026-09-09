import { isEmailConfigured } from "@/lib/email";
import { ForgotForm } from "./ForgotForm";

export const metadata = { title: "Recuperar palavra-passe" };
export const dynamic = "force-dynamic"; // lê a configuração de email em tempo de execução

export default function ForgotPage() {
  // "console" tem de ser escolhido explicitamente: em produção sem fornecedor, a página explica que não há envio de emails.
  return <ForgotForm emailConfigured={isEmailConfigured() || process.env.EMAIL_PROVIDER === "console"} />;
}
