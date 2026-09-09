import type { Event } from "@prisma/client";
import { EVENT_TYPES } from "@/lib/event-types";
import { SUPPORTED_COUNTRIES } from "@/lib/phone";
import { TIMEZONES, dateToLocalDateInput, dateToLocalInput } from "@/lib/timezone";
import { parseProgram, programToText } from "@/lib/event-types";

/** Campos de detalhe do evento, partilhados entre "novo evento" e "definições". */
export function EventDetailsFields({ event, type }: { event?: Event; type: string }) {
  const t = EVENT_TYPES[type as keyof typeof EVENT_TYPES] ?? EVENT_TYPES.OTHER;
  return (
    <div className="space-y-6">
      <input type="hidden" name="_full" value="1" />
      <fieldset className="card space-y-4">
        <legend>O essencial</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Título do evento</label>
            <input name="title" className="input" required defaultValue={event?.title ?? ""} placeholder={`Ex: ${t.label} de ${t.hostPlaceholder}`} />
          </div>
          <div>
            <label className="label">{t.hostLabel}</label>
            <input name="hostNames" className="input" required defaultValue={event?.hostNames ?? ""} placeholder={t.hostPlaceholder} />
          </div>
          <div>
            <label className="label">Data e hora de início</label>
            <input name="date" type="datetime-local" className="input" required defaultValue={event ? dateToLocalInput(event.date, event.timezone) : ""} />
          </div>
          <div>
            <label className="label">Hora de fim (opcional)</label>
            <input name="endTime" className="input" defaultValue={event?.endTime ?? ""} placeholder="02:00" />
          </div>
          <div>
            <label className="label">Fuso horário do evento</label>
            <select name="timezone" className="input" defaultValue={event?.timezone ?? "Europe/Lisbon"}>
              {TIMEZONES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <p className="hint">As horas do convite, a contagem decrescente e o calendário usam este fuso.</p>
          </div>
        </div>
        <div>
          <label className="label">Mensagem de abertura</label>
          <textarea name="message" className="input" rows={3} defaultValue={event?.message ?? ""} placeholder="Com muita alegria convidamos-te para celebrar connosco…" />
        </div>
      </fieldset>

      <fieldset className="card space-y-4">
        <legend>Local</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nome do local</label>
            <input name="venueName" className="input" required defaultValue={event?.venueName ?? ""} placeholder="Quinta da Serra" />
          </div>
          <div>
            <label className="label">Morada</label>
            <input name="venueAddress" className="input" defaultValue={event?.venueAddress ?? ""} placeholder="Estrada da Serra 12, Sintra" />
          </div>
          <div>
            <label className="label">Link do Google Maps (opcional)</label>
            <input name="mapsUrl" type="url" className="input" defaultValue={event?.mapsUrl ?? ""} placeholder="https://maps.app.goo.gl/…" />
            <p className="hint">Se vazio, o botão do mapa pesquisa pela morada.</p>
          </div>
          <div>
            <label className="label">Dress code (opcional)</label>
            <input name="dressCode" className="input" defaultValue={event?.dressCode ?? ""} placeholder="Formal, cocktail, à vontade…" />
          </div>
        </div>
      </fieldset>

      <fieldset className="card space-y-4">
        <legend>Programa do dia</legend>
        <textarea
          name="programText"
          className="input font-mono text-xs"
          rows={5}
          defaultValue={event ? programToText(parseProgram(event.programJson)) : ""}
          placeholder={"15:00 - Cerimónia - Igreja Matriz\n17:00 - Copo de água\n20:00 - Jantar e festa"}
        />
        <p className="hint">Um momento por linha: hora - título - descrição (opcional).</p>
      </fieldset>

      <fieldset className="card space-y-4">
        <legend>Convidados e segurança</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">País dos telefones (por omissão)</label>
            <select name="country" className="input" defaultValue={event?.country ?? "PT"}>
              {SUPPORTED_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <p className="hint">Números sem indicativo serão interpretados neste país.</p>
          </div>
          <div>
            <label className="label">Prazo para confirmar presença (opcional)</label>
            <input name="rsvpDeadline" type="date" className="input" defaultValue={event?.rsvpDeadline ? dateToLocalDateInput(event.rsvpDeadline, event.timezone) : ""} />
          </div>
          <div>
            <label className="label">Máximo de dispositivos por convidado</label>
            <input name="maxDevicesPerGuest" type="number" min={1} max={10} className="input" defaultValue={event?.maxDevicesPerGuest ?? 2} />
            <p className="hint">Quantos telemóveis/computadores podem validar o mesmo convite.</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="verificationRequired" defaultChecked={event?.verificationRequired ?? true} />
            Exigir validação por SMS para abrir o convite (impede que o link seja repassado)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="allowChildren" defaultChecked={event?.allowChildren ?? true} />
            Crianças são bem-vindas
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="giftsEnabled" defaultChecked={event?.giftsEnabled ?? true} />
            Mostrar lista de presentes
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="guestbookEnabled" defaultChecked={event?.guestbookEnabled ?? true} />
            Ativar livro de mensagens
          </label>
        </div>
      </fieldset>

      <fieldset className="card space-y-4">
        <legend>Contribuições em dinheiro (opcional)</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Moeda</label>
            <input name="currency" className="input" maxLength={3} defaultValue={event?.currency ?? "EUR"} placeholder="EUR, AOA, BRL, MZN" />
          </div>
          <div>
            <label className="label">IBAN</label>
            <input name="contributionIban" className="input" defaultValue={event?.contributionIban ?? ""} />
          </div>
          <div>
            <label className="label">MB WAY / número para transferência</label>
            <input name="contributionMbway" className="input" defaultValue={event?.contributionMbway ?? ""} />
          </div>
        </div>
        <div>
          <label className="label">Nota para os convidados</label>
          <input name="contributionNote" className="input" defaultValue={event?.contributionNote ?? ""} placeholder="Ex: Estamos a juntar para a lua de mel" />
        </div>
      </fieldset>
    </div>
  );
}
