import type { Event } from "@prisma/client";
import { EVENT_TYPES } from "@/lib/event-types";
import { DEFAULT_COUNTRY, SUPPORTED_COUNTRIES } from "@/lib/phone";
import { DEFAULT_TIMEZONE, TIMEZONES, dateToLocalDateInput, dateToLocalInput } from "@/lib/timezone";
import { parseProgram, programToText } from "@/lib/event-types";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/lib/format";
import { MapPicker } from "./MapPicker";

/** Campos de detalhe do evento, partilhados entre "novo evento" e "definições". */
export function EventDetailsFields({ event, type }: { event?: Event; type: string }) {
  const t = EVENT_TYPES[type as keyof typeof EVENT_TYPES] ?? EVENT_TYPES.OTHER;
  const currency = (event?.currency ?? DEFAULT_CURRENCY).toUpperCase();
  const knownCurrency = CURRENCIES.some((c) => c.code === currency);
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
            <input name="hostNames" className="input" required minLength={1} maxLength={120} defaultValue={event?.hostNames ?? ""} placeholder={t.hostPlaceholder} />
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
            <select name="timezone" className="input" defaultValue={event?.timezone ?? DEFAULT_TIMEZONE}>
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
            <label className="label" htmlFor="venueName">Nome do local</label>
            <input id="venueName" name="venueName" className="input" required minLength={2} maxLength={120} defaultValue={event?.venueName ?? ""} placeholder="Salão Nobre do Hotel Epic Sana" />
          </div>
          <div>
            <label className="label" htmlFor="venueAddress">Morada</label>
            <input id="venueAddress" name="venueAddress" className="input" maxLength={200} defaultValue={event?.venueAddress ?? ""} placeholder="Rua da Missão 12, Luanda" />
          </div>
          <div>
            <label className="label" htmlFor="mapsUrl">Link do Google Maps (opcional)</label>
            <input id="mapsUrl" name="mapsUrl" type="url" className="input" defaultValue={event?.mapsUrl ?? ""} placeholder="https://maps.app.goo.gl/…" />
            <p className="hint">Alternativa ao marcador no mapa. Se ambos estiverem vazios, o botão do mapa pesquisa pela morada.</p>
          </div>
          <div>
            <label className="label" htmlFor="dressCode">Dress code (opcional)</label>
            <input id="dressCode" name="dressCode" className="input" defaultValue={event?.dressCode ?? ""} placeholder="Formal, cocktail, à vontade…" />
          </div>
        </div>
      </fieldset>

      <fieldset className="card space-y-4">
        <legend>Localização no mapa</legend>
        <p className="-mt-2 text-sm text-muted">Marque o ponto exato: os convidados veem o mapa no convite e um botão &ldquo;Como chegar&rdquo; que abre a navegação no telemóvel.</p>
        <MapPicker initialLat={event?.venueLat ?? null} initialLng={event?.venueLng ?? null} />
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
            <label className="label" htmlFor="country">País por omissão dos telefones</label>
            <select id="country" name="country" className="input" defaultValue={event?.country ?? DEFAULT_COUNTRY}>
              {SUPPORTED_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <p className="hint">Números de outros países: escreva com o indicativo, ex.: +351 912 345 678</p>
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
            <label className="label" htmlFor="currency">Moeda</label>
            <select id="currency" name="currency" className="input" defaultValue={knownCurrency ? currency : ""}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
              <option value="">Outra (indicar código)</option>
            </select>
            <input name="currencyOther" className="input mt-2" maxLength={3} defaultValue={knownCurrency ? "" : currency} placeholder="Código ISO, ex.: CHF" aria-label="Código da moeda (se escolher Outra)" />
            <p className="hint">Usada nos preços da lista de presentes. Se escolher &ldquo;Outra&rdquo;, escreva o código de 3 letras.</p>
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
