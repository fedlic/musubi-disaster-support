"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import {
  AttributionControl,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
} from "maplibre-gl";
import { useEffect, useRef } from "react";

export type SupportPoint = {
  id: string;
  kind: "request" | "x" | "official";
  title: string;
  area: string;
  detail: string;
  privateDetail?: string;
  need: string;
  people: number;
  priority: string;
  status: string;
  assignee?: string;
  lat: number;
  lng: number;
  time: string;
};

type Props = {
  points: SupportPoint[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function MapPanel({ points, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = new MapLibreMap({
      container: containerRef.current,
      center: [130.7079, 32.8031],
      zoom: 9.2,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
    });
    mapRef.current.addControl(new NavigationControl({ showCompass: false }), "top-right");
    mapRef.current.addControl(new AttributionControl({ compact: true }), "bottom-left");
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = points.map((point) => {
      const element = document.createElement("button");
      element.className = `map-marker marker-${point.kind === "x" ? "x" : point.kind === "official" ? "公式" : point.priority} ${selectedId === point.id ? "active" : ""}`;
      element.setAttribute("aria-label", `${point.priority}: ${point.title}`);
      element.innerHTML = `<span>${point.kind === "x" ? "X" : point.kind === "official" ? "公" : point.priority === "緊急" ? "!" : "●"}</span>`;
      element.addEventListener("click", () => onSelect(point.id));
      return new Marker({ element }).setLngLat([point.lng, point.lat]).addTo(mapRef.current!);
    });
  }, [onSelect, points, selectedId]);

  useEffect(() => {
    const selected = points.find((point) => point.id === selectedId);
    if (selected && mapRef.current) {
      mapRef.current.easeTo({ center: [selected.lng, selected.lat], duration: 650 });
    }
  }, [points, selectedId]);

  return <div ref={containerRef} className="map" aria-label="支援要請の地図" />;
}
