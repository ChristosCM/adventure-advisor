"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import { LatLngBounds } from "leaflet";

export interface MapSpot {
  name: string;
  lat: number;
  lon: number;
  score: number;
  topActivity: string;
}

interface Props {
  home: { name: string; lat: number; lon: number };
  spots: MapSpot[];
  dark?: boolean;
}

function color(score: number): string {
  if (score >= 75) return "#10b981";
  if (score >= 55) return "#84cc16";
  if (score >= 35) return "#f59e0b";
  if (score >= 15) return "#f97316";
  return "#f43f5e";
}

/** Pan/zoom to fit home + all spots whenever they change. */
function FitBounds({ home, spots }: Props) {
  const map = useMap();
  useEffect(() => {
    const pts: [number, number][] = [
      [home.lat, home.lon],
      ...spots.map((s) => [s.lat, s.lon] as [number, number]),
    ];
    if (pts.length === 1) {
      map.setView(pts[0], 9);
      return;
    }
    map.fitBounds(new LatLngBounds(pts), { padding: [40, 40] });
  }, [map, home, spots]);
  return null;
}

export default function MapView({ home, spots, dark }: Props) {
  // CartoDB basemaps — cleaner/more minimal than raw OSM, with a dark variant.
  const tileUrl = dark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <MapContainer
      center={[home.lat, home.lon]}
      zoom={8}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        key={dark ? "dark" : "light"}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={tileUrl}
      />

      {/* Home */}
      <CircleMarker
        center={[home.lat, home.lon]}
        radius={8}
        pathOptions={{
          color: dark ? "#2dd4bf" : "#0f766e",
          fillColor: dark ? "#5eead4" : "#14b8a6",
          fillOpacity: 1,
        }}
      >
        <Tooltip>🏠 {home.name}</Tooltip>
      </CircleMarker>

      {/* Recommended spots */}
      {spots.map((s) => (
        <CircleMarker
          key={`${s.lat},${s.lon}`}
          center={[s.lat, s.lon]}
          radius={9}
          pathOptions={{
            color: dark ? "#e2e8f0" : "#1e293b",
            weight: 1.5,
            fillColor: color(s.score),
            fillOpacity: 0.95,
          }}
        >
          <Tooltip>
            <span className="font-semibold">{s.name}</span>
            <br />
            {s.topActivity} · score {s.score}
          </Tooltip>
        </CircleMarker>
      ))}

      <FitBounds home={home} spots={spots} />
    </MapContainer>
  );
}
