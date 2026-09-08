/**
 * Código QR de transferência SEPA (norma EPC069-12), reconhecido pelas apps bancárias europeias:
 * o convidado aponta a câmara e a transferência fica pré-preenchida.
 */
export function buildEpcPayload(opts: { iban: string; name: string; amount?: number; remittance?: string }): string | null {
  const iban = opts.iban.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return null;
  const lines = [
    "BCD",
    "002",
    "1",
    "SCT",
    "", // BIC opcional
    opts.name.slice(0, 70),
    iban,
    opts.amount && opts.amount > 0 ? `EUR${opts.amount.toFixed(2)}` : "",
    "",
    "",
    (opts.remittance ?? "").slice(0, 140),
  ];
  return lines.join("\n");
}
