/**
 * Abstração do envio de SMS/WhatsApp para validação dos convidados.
 * - "console": imprime no terminal (desenvolvimento).
 * - "twilio": envia via API REST da Twilio (SMS ou WhatsApp, conforme TWILIO_FROM).
 * Para adicionar outro fornecedor (ex: Vonage, Africa's Talking, Infobip) basta implementar SmsProvider.
 */
export interface SmsProvider {
  send(to: string, body: string): Promise<{ ok: boolean; error?: string }>;
}

class ConsoleSmsProvider implements SmsProvider {
  async send(to: string, body: string) {
    console.log(`\n[SMS → ${to}]\n${body}\n`);
    return { ok: true };
  }
}

class TwilioSmsProvider implements SmsProvider {
  constructor(private sid: string, private token: string, private from: string) {}

  async send(to: string, body: string) {
    const isWhatsApp = this.from.startsWith("whatsapp:");
    const params = new URLSearchParams({
      From: this.from,
      To: isWhatsApp ? `whatsapp:${to}` : to,
      Body: body,
    });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${this.sid}:${this.token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Twilio ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  }
}

export function getSmsProvider(): SmsProvider {
  if (process.env.SMS_PROVIDER === "twilio") {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
      throw new Error("SMS_PROVIDER=twilio requer TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_FROM");
    }
    return new TwilioSmsProvider(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM);
  }
  return new ConsoleSmsProvider();
}

export function otpMessage(code: string, eventTitle: string) {
  return `${code} é o seu código para abrir o convite "${eventTitle}". Válido por 10 minutos. Não partilhe este código.`;
}
