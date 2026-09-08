export function appUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function inviteUrl(token: string) {
  return `${appUrl()}/c/${token}`;
}

/** Mensagem pré-preenchida para enviar o link pessoal por WhatsApp/SMS. */
export function inviteShareMessage(opts: { guestName: string; hostNames: string; eventTitle: string; url: string }) {
  return (
    `Olá ${opts.guestName}! ${opts.hostNames} têm todo o gosto em convidar-te para: ${opts.eventTitle}.\n\n` +
    `Abre o teu convite pessoal aqui: ${opts.url}\n\n` +
    `Este link é só teu e pede confirmação pelo teu número de telemóvel. Por favor não o partilhes.`
  );
}
