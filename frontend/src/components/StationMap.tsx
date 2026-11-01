/**
 * The chosen place and the stations round it, on the road map Good Earth uses.
 * Tapping the ground moves the place. Tapping a station names it, with the one
 * button that adds it to the patron's stations or takes it out.
 */

import { useEffect, useRef, useState } from "react";
import L from "leaflet";

const STREET_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const STREET_ATTRIBUTION = "© OpenStreetMap contributors";
const PLACE_COLOR = "#2f6f8f";
const STATION_COLOR = "#c9a15a";
const CHOSEN_COLOR = "#8a6420";
const EDGE_COLOR = "#fffdf7";
const PLACE_ZOOM = 10;

export interface MapStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  chosen: boolean;
  line: string;
  toggle: () => void;
}

export default function StationMap({ place, stations, onPlace }: {
  place: { latitude: number; longitude: number } | null;
  stations: MapStation[];
  onPlace: (latitude: number, longitude: number) => void;
}) {
  const host = useRef<HTMLDivElement | null>(null);
  const map = useRef<L.Map | null>(null);
  const placed = useRef<L.LayerGroup | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  const tell = useRef(onPlace);
  tell.current = onPlace;
  const [tappedId, setTappedId] = useState<string | null>(null);
  const tapped = stations.find((s) => s.id === tappedId) ?? null;
  const stationKey = stations.map((s) => s.id).join();

  useEffect(() => {
    if (!host.current) return;
    const m = L.map(host.current, { tapTolerance: 15, bounceAtZoomLimits: false }).setView([30, -40], 2);
    L.tileLayer(STREET_URL, { attribution: STREET_ATTRIBUTION, maxZoom: 19 }).addTo(m);
    placed.current = L.layerGroup().addTo(m);
    markers.current = L.layerGroup().addTo(m);
    m.on("click", (e: L.LeafletMouseEvent) => tell.current(e.latlng.lat, e.latlng.wrap().lng));
    map.current = m;
    setTimeout(() => m.invalidateSize(), 0);
    return () => { m.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const g = placed.current;
    const m = map.current;
    if (!g || !m) return;
    g.clearLayers();
    if (!place) return;
    L.circleMarker([place.latitude, place.longitude], { radius: 8, color: EDGE_COLOR, weight: 2, fillColor: PLACE_COLOR, fillOpacity: 1 })
      .bindTooltip("Your place", { direction: "top", offset: [0, -6] })
      .addTo(g);
    const here = L.latLng(place.latitude, place.longitude);
    if (!m.getBounds().contains(here) || m.getZoom() < PLACE_ZOOM) m.setView(here, Math.max(m.getZoom(), PLACE_ZOOM));
  }, [place?.latitude, place?.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const g = markers.current;
    if (!g) return;
    g.clearLayers();
    for (const s of stations) {
      L.circleMarker([s.latitude, s.longitude], { radius: 9, color: EDGE_COLOR, weight: 2, fillColor: s.chosen ? CHOSEN_COLOR : STATION_COLOR, fillOpacity: 1 })
        .bindTooltip(s.name, { direction: "top", offset: [0, -6] })
        .on("click", (e) => { L.DomEvent.stop(e); setTappedId(s.id); })
        .addTo(g);
    }
  }, [stations]);

  // Frame the stations once when a search brings a new set, then the map is the patron's.
  useEffect(() => {
    const m = map.current;
    if (!m || !stations.length) return;
    const points = stations.map((s): L.LatLngTuple => [s.latitude, s.longitude]);
    if (place) points.push([place.latitude, place.longitude]);
    m.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 13 });
  }, [stationKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mt-3 grid gap-1">
      <div className="relative isolate h-[40vh] min-h-[300px] overflow-hidden rounded border border-[var(--tb-line)]">
        <div ref={host} className="h-full w-full" />
        {tapped && (
          <div className="card absolute inset-x-2 bottom-6 z-[500] flex flex-wrap items-center gap-2 p-2 text-sm">
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{tapped.name}</span>
              {tapped.line && <span className="block font-mono text-xs text-[var(--tb-muted)]">{tapped.line}</span>}
            </span>
            <button type="button" className={tapped.chosen ? "chip" : "chip chip-accent"} onClick={tapped.toggle}>
              {tapped.chosen ? "Remove from my stations" : "Add to my stations"}
            </button>
          </div>
        )}
      </div>
      <p className="prose-line text-sm">Tap the map to set your place, then choose Find stations.</p>
    </div>
  );
}
