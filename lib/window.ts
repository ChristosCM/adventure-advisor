import { ACTIVITIES, scoreWeather } from "@/data/activities";
import { config } from "@/data/config";
import type { ActivityId, DayWeather, HourPoint } from "@/lib/types";

export interface ScoredHour {
  hour: number;
  score: number; // 0–100 suitability for this activity, this hour
  point: HourPoint;
}

export interface BestWindow {
  startHour: number; // inclusive
  endHour: number; // inclusive (the last good hour)
  length: number; // number of good hours
  avgScore: number;
}

/** Score a single hour by reusing the activity's daily scoring on a 1-hour "day". */
function scoreHour(activity: ActivityId, p: HourPoint): number {
  const pseudo: DayWeather = {
    date: "",
    tempMax: p.temp,
    tempMin: p.temp,
    tempMean: p.temp,
    precipSum: p.precip,
    precipProbMax: p.precipProb,
    windMax: p.gust,
    gustMax: p.gust,
    weatherCode: p.code,
    sunrise: "",
    sunset: "",
    recentPrecipMm: null,
    hours: [],
  };
  return scoreWeather(activity, pseudo);
}

function hourFromTime(t: string): number {
  const n = parseInt(t.slice(0, 2), 10);
  return Number.isFinite(n) ? n : 0;
}

/** The activity-scored hours within daylight (sunrise–sunset). */
export function scoredDaylightHours(
  activity: ActivityId,
  day: DayWeather,
): ScoredHour[] {
  const sunriseH = day.sunrise ? hourFromTime(day.sunrise) : config.timeline.startHour;
  const sunsetH = day.sunset ? hourFromTime(day.sunset) : config.timeline.endHour;
  return day.hours
    .filter((p) => p.hour >= sunriseH && p.hour <= sunsetH)
    .map((p) => ({ hour: p.hour, score: scoreHour(activity, p), point: p }));
}

/**
 * Longest contiguous run of "good" hours (score ≥ threshold) within daylight.
 * Ties are broken by the higher average score. Returns null if no hour is good.
 */
export function bestWindow(
  activity: ActivityId,
  day: DayWeather,
): BestWindow | null {
  const scored = scoredDaylightHours(activity, day);
  const threshold = config.goodHourThreshold;

  let best: BestWindow | null = null;
  let runStart = -1;
  let runSum = 0;

  const flush = (endHour: number) => {
    if (runStart === -1) return;
    const length = endHour - runStart + 1;
    const avg = runSum / length;
    if (
      !best ||
      length > best.length ||
      (length === best.length && avg > best.avgScore)
    ) {
      best = { startHour: runStart, endHour, length, avgScore: Math.round(avg) };
    }
  };

  let prevHour = -99;
  for (const s of scored) {
    const good = s.score >= threshold;
    const contiguous = s.hour === prevHour + 1;
    if (good && runStart !== -1 && contiguous) {
      runSum += s.score;
    } else {
      if (runStart !== -1) flush(prevHour);
      runStart = good ? s.hour : -1;
      runSum = good ? s.score : 0;
    }
    prevHour = s.hour;
  }
  if (runStart !== -1) flush(prevHour);

  return best;
}

/** "09:00–14:00" for a window whose last good hour is `endHour`
 *  (we add 1 so it reads as the end of that hour). */
export function formatWindow(w: BestWindow): string {
  const pad = (h: number) => `${String(h).padStart(2, "0")}:00`;
  return `${pad(w.startHour)}–${pad(Math.min(w.endHour + 1, 24))}`;
}
