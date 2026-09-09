/**
 * Envio de email (recuperação de palavra-passe). "console" em desenvolvimento;
 * "resend" usa a API HTTP da Resend (RESEND_API_KEY + EMAIL_FROM). Outros fornecedores: implementar EmailProvider.
 */
export interface EmailProvider {
  send(to: string, subject: string, text: string): Promise<{ ok: boolean; error?: string }>;
}

class ConsoleEmailProvider implements EmailProvider {
  async send(to: string, subject: string, text: string) {
    console.log(`\n[EMAIL → ${to}] ${subject}\n${text}\n`);
    return { ok: true };
  }
}

class ResendEmailProvider implements EmailProvider {
  constructor(private apiKey: string, private from: string) {}
  async send(to: string, subject: string, text: string) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: this.from, to: [to], subject, text }),
    });
    if (!res.ok) return { ok: false, error: `Resend ${res.status}` };
    return { ok: true };
  }
}

export function isEmailConfigured(): boolean {
  return process.env.EMAIL_PROVIDER === "resend" && !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

export function getEmailProvider(): EmailProvider {
  if (process.env.EMAIL_PROVIDER === "resend") {
    const { RESEND_API_KEY, EMAIL_FROM } = process.env;
    if (!RESEND_API_KEY || !EMAIL_FROM) throw new Error("EMAIL_PROVIDER=resend requer RESEND_API_KEY e EMAIL_FROM");
    return new ResendEmailProvider(RESEND_API_KEY, EMAIL_FROM);
  }
  return new ConsoleEmailProvider();
}
