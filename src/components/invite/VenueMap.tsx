"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { addOsmTiles, loadLeaflet, markerIcon } from "@/lib/leaflet";
import { MARKER_ZOOM } from "@/lib/geo";

/** Pré-visualização estática do local no convite: sem arrastar nem zoom, só o marcador e os azulejos do OSM. */
export function VenueMap({ lat, lng, className = "" }: { lat: number; lng: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    let map: import("leaflet").Map | null = null;
    loadLeaflet().then((L) => {
      if (cancelled || !el) return;
      map = L.map(el, {
        center: [lat, lng],
        zoom: MARKER_ZOOM,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        zoomControl: false,
        attributionControl: true,
        tap: false,
      } as import("leaflet").MapOptions);
      addOsmTiles(L, map);
      const accent = getComputedStyle(el).getPropertyValue("--inv-accent").trim() || "#541b38";
      L.marker([lat, lng], { icon: markerIcon(L, accent), interactive: false, keyboard: false }).addTo(map);
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng]);

  return <div ref={ref} className={`h-44 w-full overflow-hidden rounded-xl bg-stone-100 ${className}`} role="img" aria-label="Mapa com a localização do evento" />;
}
