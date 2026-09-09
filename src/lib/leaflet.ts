"use client";

import type * as Leaflet from "leaflet";

/**
 * Carregamento do Leaflet apenas no browser (a biblioteca toca em `window` ao ser importada,
 * por isso nunca pode entrar no bundle do servidor). Usado pelo MapPicker (painel) e pelo VenueMap (convite).
 */
export type L = typeof Leaflet;

let pending: Promise<L> | null = null;

export function loadLeaflet(): Promise<L> {
  if (!pending) {
    pending = import("leaflet").then((mod) => ((mod as { default?: L }).default ?? mod) as L);
  }
  return pending;
}

export const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';

/** Marcador em SVG embutido (as imagens por omissão do Leaflet não resolvem no Next). */
export function markerIcon(L: L, color = "#541b38"): Leaflet.DivIcon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44" aria-hidden="true">
  <path d="M17 1C8.2 1 1 8.1 1 16.9c0 11.6 14.2 25 15.2 25.8a1.2 1.2 0 0 0 1.6 0C18.8 41.9 33 28.5 33 16.9 33 8.1 25.8 1 17 1z" fill="${color}" stroke="#fff" stroke-width="2"/>
  <circle cx="17" cy="17" r="6" fill="#fff"/>
</svg>`;
  return L.divIcon({ html: svg, className: "lp-marker", iconSize: [34, 44], iconAnchor: [17, 43], popupAnchor: [0, -40] });
}

export function addOsmTiles(L: L, map: Leaflet.Map) {
  L.tileLayer(OSM_TILES, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(map);
}
