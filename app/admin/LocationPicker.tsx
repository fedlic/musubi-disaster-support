"use client";

import { Map as MapLibreMap, Marker } from "maplibre-gl";
import { useEffect, useRef } from "react";

export default function LocationPicker({ lat, lng, onPick }: { lat: number; lng: number; onPick: (lat: number, lng: number) => void }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!container.current) return;
    const map = new MapLibreMap({
      container: container.current, center: [lng, lat], zoom: 13,
      style: { version: 8, sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256 } }, layers: [{ id: "osm", type: "raster", source: "osm" }] },
    });
    const marker = new Marker({ color: "#087267" }).setLngLat([lng, lat]).addTo(map);
    map.on("click", (event) => {
      marker.setLngLat(event.lngLat);
      onPick(Number(event.lngLat.lat.toFixed(6)), Number(event.lngLat.lng.toFixed(6)));
    });
    return () => map.remove();
  }, [lat, lng, onPick]);
  return <div className="admin-location-map" ref={container} aria-label="クリックして公開位置を変更" />;
}
