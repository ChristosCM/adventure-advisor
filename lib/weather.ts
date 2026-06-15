import { config } from "@/data/config";
import type { DayWeather, HourPoint } from "@/lib/types";

/**
 * Open-Meteo forecast client.
 *
 * Free, no API key. We request hourly + daily fields for a date range and
 * collapse the hourly data into one `DayWeather` summary per day. We also keep
 * an hourly series (for the timeline / "best window"), daylight times, and the
 * rainfall over the preceding days (for "ground conditions").
 *
 * Results are cached per (lat, lon, date) in a module-level Map that lives
 * for the lifetime of the server process (i.e. the session).
 */

const cache = new Map<string, DayWeather>();

function cacheKey(lat: number, lon: number, date: string): string {
  return `${lat.toFixed(3)},${lon.toFixed(3)},${date}`;
}

interface OpenMeteoResponse {
  hourly?: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
    precipitation_probability: number[];
    wind_speed_10m: number[];
    wind_gusts_10m: number[];
    weather_code: number[];
  };
  daily?: {
    time: string[];
    sunrise: string[];
    sunset: string[];
  };
}

const HOURLY_FIELDS = [
  "temperature_2m",
  "precipitation",
  "precipitation_probability",
  "wind_speed_10m",
  "wind_gusts_10m",
  "weather_code",
].join(",");

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Add `n` days to a YYYY-MM-DD string (local), returning YYYY-MM-DD. */
function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + n);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Index every hourly row by date → hour → values, for easy lookups. */
type HourlyIndex = Map<string, Map<number, HourPoint>>;

function indexHourly(h: OpenMeteoResponse["hourly"]): HourlyIndex {
  const idx: HourlyIndex = new Map();
  if (!h) return idx;
  for (let i = 0; i < h.time.length; i++) {
    const t = h.time[i]; // "2026-06-20T13:00"
    const date = t.slice(0, 10);
    const hour = parseInt(t.slice(11, 13), 10);
    if (!idx.has(date)) idx.set(date, new Map());
    idx.get(date)!.set(hour, {
      hour,
      temp: h.temperature_2m[i] ?? 0,
      precip: h.precipitation[i] ?? 0,
      precipProb: h.precipitation_probability[i] ?? 0,
      gust: h.wind_gusts_10m[i] ?? 0,
      code: h.weather_code[i] ?? 0,
    });
  }
  return idx;
}

/** "HH:MM" from an ISO datetime like "2026-06-20T04:44". */
function timeOfDay(iso: string | undefined): string {
  return iso ? iso.slice(11, 16) : "";
}

/** Build the DayWeather summary for one date from the indexed hourly data. */
function buildDay(
  date: string,
  idx: HourlyIndex,
  daily: Map<string, { sunrise: string; sunset: string }>,
): DayWeather | null {
  const dayHours = idx.get(date);
  if (!dayHours) return null;

  // Daily summary over the daytime window.
  const temps: number[] = [];
  let precipSum = 0;
  let precipProbMax = 0;
  let windMax = 0;
  let gustMax = 0;
  let weatherCode = 0;
  let found = false;

  for (const [hour, p] of dayHours) {
    if (hour < config.daytime.startHour || hour >= config.daytime.endHour) continue;
    found = true;
    temps.push(p.temp);
    precipSum += p.precip;
    precipProbMax = Math.max(precipProbMax, p.precipProb);
    gustMax = Math.max(gustMax, p.gust);
    windMax = Math.max(windMax, p.gust); // gusts as the conservative wind figure
    weatherCode = Math.max(weatherCode, p.code);
  }
  if (!found) return null;

  // Hourly series for the timeline band.
  const hours: HourPoint[] = [];
  for (let h = config.timeline.startHour; h <= config.timeline.endHour; h++) {
    const p = dayHours.get(h);
    if (p) hours.push(p);
  }

  // Antecedent rainfall: sum precip over the preceding N days (all hours).
  let recentPrecipMm: number | null = 0;
  let haveAntecedent = true;
  for (let back = 1; back <= config.antecedentDays; back++) {
    const prev = idx.get(addDays(date, -back));
    if (!prev) {
      haveAntecedent = false;
      break;
    }
    for (const p of prev.values()) recentPrecipMm += p.precip;
  }
  if (!haveAntecedent) recentPrecipMm = null;
  else recentPrecipMm = round1(recentPrecipMm);

  const day = daily.get(date);

  return {
    date,
    tempMax: round1(Math.max(...temps)),
    tempMin: round1(Math.min(...temps)),
    tempMean: round1(temps.reduce((a, b) => a + b, 0) / temps.length),
    precipSum: round1(precipSum),
    precipProbMax: Math.round(precipProbMax),
    windMax: Math.round(windMax),
    gustMax: Math.round(gustMax),
    weatherCode,
    sunrise: day?.sunrise ?? "",
    sunset: day?.sunset ?? "",
    recentPrecipMm,
    hours,
  };
}

/**
 * Fetch weather summaries for the given dates at one location.
 * Returns a Map keyed by date. Throws if the API call fails.
 */
export async function getWeather(
  lat: number,
  lon: number,
  dates: string[],
): Promise<Map<string, DayWeather>> {
  const result = new Map<string, DayWeather>();
  const missing = dates.filter((d) => !cache.has(cacheKey(lat, lon, d)));

  if (missing.length > 0) {
    const minDate = missing.reduce((a, b) => (a < b ? a : b));
    const maxDate = missing.reduce((a, b) => (a > b ? a : b));
    // Reach back a couple of days so we can measure antecedent rainfall.
    const start = addDays(minDate, -config.antecedentDays);

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&hourly=${HOURLY_FIELDS}` +
      `&daily=sunrise,sunset` +
      `&start_date=${start}&end_date=${maxDate}` +
      `&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo ${res.status} for ${lat},${lon}`);
    }
    const data: OpenMeteoResponse = await res.json();

    const idx = indexHourly(data.hourly);
    const daily = new Map<string, { sunrise: string; sunset: string }>();
    if (data.daily) {
      for (let i = 0; i < data.daily.time.length; i++) {
        daily.set(data.daily.time[i], {
          sunrise: timeOfDay(data.daily.sunrise[i]),
          sunset: timeOfDay(data.daily.sunset[i]),
        });
      }
    }

    for (const d of missing) {
      const day = buildDay(d, idx, daily);
      if (day) cache.set(cacheKey(lat, lon, d), day);
    }
  }

  for (const d of dates) {
    const cached = cache.get(cacheKey(lat, lon, d));
    if (cached) result.set(d, cached);
  }
  return result;
}
