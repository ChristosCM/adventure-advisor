import { config } from "@/data/config";
import type { DriveInfo } from "@/lib/types";

/**
 * Drive-time estimation.
 *
 * Primary: the public OSRM demo server (router.project-osrm.org), which is
 * free but rate-limited and occasionally down. On any failure we fall back to
 * a straight-line haversine distance with a rough average road speed, and
 * flag the result as `estimated`.
 *
 * Cached per destination (lat, lon) for the session — home never moves.
 */

const cache = new Map<string, DriveInfo>();

function key(lat: number, lon: number): string {
  return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}

/** Great-circle distance in km. */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Rough fallback: straight-line distance × detour factor ÷ avg speed. */
function haversineFallback(lat: number, lon: number): DriveInfo {
  const straight = haversineKm(config.home.lat, config.home.lon, lat, lon);
  const roadKm = straight * 1.3; // roads aren't straight
  const avgKmh = 70; // mix of motorway + A-roads
  return {
    km: Math.round(roadKm),
    minutes: Math.round((roadKm / avgKmh) * 60),
    estimated: true,
  };
}

export async function getDrive(lat: number, lon: number): Promise<DriveInfo> {
  const k = key(lat, lon);
  const cached = cache.get(k);
  if (cached) return cached;

  let info: DriveInfo;
  try {
    // OSRM expects lon,lat order.
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${config.home.lon},${config.home.lat};${lon},${lat}` +
      `?overview=false`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) throw new Error("OSRM: no route");

    info = {
      minutes: Math.round(route.duration / 60),
      km: Math.round(route.distance / 1000),
      estimated: false,
    };
  } catch {
    info = haversineFallback(lat, lon);
  }

  cache.set(k, info);
  return info;
}
