"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, MapPin, Search, X } from "lucide-react";
import { addOsmTiles, loadLeaflet, markerIcon } from "@/lib/leaflet";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, MARKER_ZOOM, type GeoResult, type LatLng } from "@/lib/geo";

type LeafletMap = import("leaflet").Map;
type LeafletMarker = import("leaflet").Marker;

/**
 * Escolha do local exato no mapa (painel): pesquisa via /api/geocode + marcador arrastável.
 * Os valores seguem no formulário como venueLat/venueLng (vazios quando não há marcador).
 */
export function MapPicker({ initialLat, initialLng, addressInputName = "venueAddress" }: { initialLat: number | null; initialLng: number | null; addressInputName?: string }) {
  const hasInitial = typeof initialLat === "number" && typeof initialLng === "number";
  const [position, setPosition] = useState<LatLng | null>(hasInitial ? { lat: initialLat, lng: initialLng } : null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const leafletRef = useRef<import("@/lib/leaflet").L | null>(null);

  /** Cria ou move o marcador; `pan` centra o mapa nele. */
  const placeMarker = useCallback((p: LatLng, pan: boolean) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (!markerRef.current) {
      const m = L.marker([p.lat, p.lng], { icon: markerIcon(L), draggable: true, autoPan: true, title: "Arraste para ajustar" }).addTo(map);
      m.on("dragend", () => {
        const ll = m.getLatLng();
        setPosition({ lat: ll.lat, lng: ll.lng });
      });
      markerRef.current = m;
    } else {
      markerRef.current.setLatLng([p.lat, p.lng]);
    }
    if (pan) map.setView([p.lat, p.lng], Math.max(map.getZoom(), MARKER_ZOOM), { animate: true });
    setPosition(p);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !el) return;
      leafletRef.current = L;
      const start = position ?? DEFAULT_MAP_CENTER;
      const map = L.map(el, { center: [start.lat, start.lng], zoom: position ? MARKER_ZOOM : DEFAULT_MAP_ZOOM, scrollWheelZoom: false });
      addOsmTiles(L, map);
      map.on("click", (e: import("leaflet").LeafletMouseEvent) => placeMarker({ lat: e.latlng.lat, lng: e.latlng.lng }, false));
      mapRef.current = map;
      if (position) placeMarker(position, false);
      setReady(true);
    });
    return () => {
      cancelled = true;
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // O mapa é criado uma única vez; as coordenadas iniciais só interessam na montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search() {
    const q = query.trim();
    if (q.length < 3) {
      setError("Escreva pelo menos 3 letras.");
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { headers: { Accept: "application/json" } });
      const body = (await res.json().catch(() => ({}))) as { results?: GeoResult[]; error?: string };
      if (!res.ok) {
        setError(body.error ?? "Não foi possível pesquisar. Tente de novo.");
        setResults([]);
      } else {
        setResults(body.results ?? []);
        if (!body.results?.length) setError("Sem resultados. Tente acrescentar a cidade ou o bairro, ou clique diretamente no mapa.");
      }
    } catch {
      setError("Não foi possível pesquisar. Verifique a ligação.");
    } finally {
      setSearching(false);
    }
  }

  function choose(r: GeoResult) {
    placeMarker({ lat: r.lat, lng: r.lng }, true);
    setResults([]);
    // Preenche a morada se ainda estiver vazia (o organizador pode sempre editá-la).
    const form = containerRef.current?.closest("form");
    const address = form?.querySelector<HTMLInputElement>(`input[name="${addressInputName}"]`);
    if (address && !address.value.trim()) address.value = r.label;
  }

  function clear() {
    markerRef.current?.remove();
    markerRef.current = null;
    setPosition(null);
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="venueLat" value={position ? position.lat.toFixed(6) : ""} />
      <input type="hidden" name="venueLng" value={position ? position.lng.toFixed(6) : ""} />

      <div>
        <label className="label" htmlFor="map-search">Procurar local</label>
        <div className="flex gap-2">
          <input
            id="map-search"
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void search();
              }
            }}
            placeholder="Ex.: Hotel Epic Sana, Luanda"
            autoComplete="off"
          />
          <button type="button" className="btn-secondary flex-none" onClick={() => void search()} disabled={searching} aria-label="Procurar">
            {searching ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden />}
            <span className="hidden sm:inline">Procurar</span>
          </button>
        </div>
        {error && <p className="hint text-red-700">{error}</p>}
        {results.length > 0 && (
          <ul className="mt-2 overflow-hidden rounded-2xl bg-white shadow-[0_2px_24px_rgba(84,27,56,0.08)]">
            {results.map((r, i) => (
              <li key={`${r.lat},${r.lng},${i}`}>
                <button type="button" onClick={() => choose(r)} className="flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm hover:bg-brand-50">
                  <MapPin className="mt-0.5 h-4 w-4 flex-none text-brand-500" strokeWidth={1.75} aria-hidden />
                  <span>{r.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative">
        <div ref={containerRef} className="h-72 w-full overflow-hidden rounded-2xl bg-stone-100" aria-label="Mapa para escolher o local" />
        {!ready && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden />A carregar o mapa…
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        {position ? (
          <span>Marcador em {position.lat.toFixed(5)}, {position.lng.toFixed(5)}. Arraste-o ou clique no mapa para ajustar.</span>
        ) : (
          <span>Clique no mapa ou pesquise para colocar o marcador no local exato.</span>
        )}
        {position && (
          <button type="button" className="btn-ghost btn-sm" onClick={clear}>
            <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />Remover marcador
          </button>
        )}
      </div>
    </div>
  );
}
