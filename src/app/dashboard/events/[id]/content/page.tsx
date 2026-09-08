import { requireOwnedEvent } from "@/lib/auth";
import { parseGallery, parseParty, parseStory, partyToText, storyToText } from "@/lib/event-types";
import { updateContentAction } from "@/app/dashboard/actions";
import { FlashFromSearch } from "@/components/ui";

export default async function ContentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { event } = await requireOwnedEvent(id);
  const isWedding = event.type === "WEDDING" || event.type === "ENGAGEMENT";

  return (
    <>
      <FlashFromSearch {...sp} />
      <form action={updateContentAction.bind(null, id)} className="space-y-6">
        <fieldset className="card space-y-3">
          <legend className="px-1 text-sm font-semibold text-stone-700">Experiência</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="envelopeEnabled" defaultChecked={event.envelopeEnabled} />
            Mostrar o envelope de abertura ("Abrir convite") antes do convite
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="songRequestsEnabled" defaultChecked={event.songRequestsEnabled} />
            Deixar os convidados sugerir músicas na confirmação de presença
          </label>
          <div>
            <label className="label">Música de fundo (link para MP3)</label>
            <input name="musicUrl" type="url" className="input" defaultValue={event.musicUrl ?? ""} placeholder="https://…/musica.mp3" />
            <p className="hint">Aparece um botão flutuante para tocar/pausar. Use um ficheiro alojado (Dropbox com ?raw=1, Google Drive público, o seu site). Links do Spotify ou YouTube não funcionam como áudio.</p>
          </div>
          <div>
            <label className="label">Hashtag do evento</label>
            <input name="hashtag" className="input" defaultValue={event.hashtag ?? ""} placeholder="#AnaEJoao2027" />
          </div>
        </fieldset>

        <fieldset className="card space-y-3">
          <legend className="px-1 text-sm font-semibold text-stone-700">{isWedding ? "A nossa história" : "A história"}</legend>
          <textarea
            name="storyText"
            className="input font-mono text-xs"
            rows={6}
            defaultValue={storyToText(parseStory(event.storyJson))}
            placeholder={"2019 - Conhecemo-nos - Numa festa de amigos em Lisboa - https://…/foto1.jpg\n2023 - O pedido - Ao pôr do sol em Sintra\n2027 - O grande dia"}
          />
          <p className="hint">Um momento por linha: data - título - texto - link da foto (texto e foto opcionais). Aparece como uma linha do tempo.</p>
        </fieldset>

        <fieldset className="card space-y-3">
          <legend className="px-1 text-sm font-semibold text-stone-700">Galeria de fotos</legend>
          <textarea name="galleryText" className="input font-mono text-xs" rows={5} defaultValue={parseGallery(event.galleryJson).join("\n")} placeholder={"https://…/foto1.jpg\nhttps://…/foto2.jpg"} />
          <p className="hint">Um link de imagem por linha (até 30). A primeira aparece em destaque.</p>
        </fieldset>

        <fieldset className="card space-y-3">
          <legend className="px-1 text-sm font-semibold text-stone-700">{isWedding ? "Padrinhos, madrinhas e damas" : "Pessoas especiais"}</legend>
          <textarea name="partyText" className="input font-mono text-xs" rows={5} defaultValue={partyToText(parseParty(event.partyJson))} placeholder={"Rita Sousa - Madrinha - https://…/rita.jpg\nTiago Lopes - Padrinho\nLeonor - Menina das alianças"} />
          <p className="hint">Uma pessoa por linha: nome - papel - link da foto (papel e foto opcionais).</p>
        </fieldset>

        <fieldset className="card space-y-3">
          <legend className="px-1 text-sm font-semibold text-stone-700">Informações úteis</legend>
          <textarea name="extraInfo" className="input" rows={6} defaultValue={event.extraInfo ?? ""} placeholder={"Alojamento: temos preço especial no Hotel X (código LIPLIIP).\n\nTransporte: autocarro à saída da igreja às 17h30.\n\nEstacionamento gratuito na quinta."} />
          <p className="hint">Alojamento, transporte, estacionamento, contactos. Separe parágrafos com uma linha em branco.</p>
        </fieldset>

        <button className="btn-primary">Guardar conteúdo</button>
      </form>
    </>
  );
}
