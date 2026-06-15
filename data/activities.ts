import type { ActivityId, DayWeather } from "@/lib/types";

/**
 * Per-activity weather preferences. TUNE THESE FREELY.
 *
 * Each activity starts at 100 points and loses points for conditions it
 * dislikes. The `weights` encode real-world preferences:
 *
 *  - `idealTempMin/Max`  comfortable daytime-high range (°C). Outside it,
 *                        we subtract `coldPenalty`/`heatPenalty` per °C.
 *  - `rainPerMm`         points lost per mm of daytime precipitation.
 *  - `rainProb`          points lost at 100% precip probability (scaled).
 *  - `windOver`          wind speed (km/h) above which wind starts to hurt.
 *  - `windPerKmh`        points lost per km/h of gust above `windOver`.
 *  - `severeWeather`     extra flat penalty for snow / thunderstorm codes.
 */
export interface ActivityConfig {
  id: ActivityId;
  label: string;
  emoji: string;
  /** One line on what makes a good day for this sport. */
  description: string;
  /** Sub-disciplines / types of this activity, shown as tags. */
  types: string[];
  idealTempMin: number;
  idealTempMax: number;
  coldPenalty: number;
  heatPenalty: number;
  rainPerMm: number;
  rainProb: number;
  windOver: number;
  windPerKmh: number;
  severeWeather: number;
}

export const ACTIVITIES: Record<ActivityId, ActivityConfig> = {
  // Wants DRY + MILD. Wet rock is dangerous and ruins friction, so rain is
  // punished hard and even rain *probability* is discouraging.
  climbing: {
    id: "climbing",
    label: "Climbing",
    emoji: "🧗",
    description:
      "A good day is dry rock with friction, a venue that matches your style and grade, and tides or seasonal closures on your side.",
    types: ["Bouldering", "Sport", "Trad", "Top-rope", "Deep-water solo", "Multi-pitch"],
    idealTempMin: 10,
    idealTempMax: 22,
    coldPenalty: 2.5,
    heatPenalty: 2.5,
    rainPerMm: 25,
    rainProb: 45,
    windOver: 25,
    windPerKmh: 1.2,
    severeWeather: 50,
  },

  // Penalises WIND heavily (exposed, fast) and rain (cold, poor grip/visibility).
  "road-cycling": {
    id: "road-cycling",
    label: "Road cycling",
    emoji: "🚴",
    description:
      "A good day is quiet tarmac, a named climb or two to test the legs, and a long loop linking big views with a café stop.",
    types: ["Climbing", "Sportive", "Endurance loops", "Gravel", "Audax"],
    idealTempMin: 12,
    idealTempMax: 26,
    coldPenalty: 2,
    heatPenalty: 1.5,
    rainPerMm: 12,
    rainProb: 25,
    windOver: 18,
    windPerKmh: 2.2,
    severeWeather: 40,
  },

  // Tolerates DAMP (mud is part of the fun) but heavy rain is miserable and
  // wrecks trails. Wind barely matters in the trees.
  "mountain-biking": {
    id: "mountain-biking",
    label: "Mountain biking",
    emoji: "🚵",
    description:
      "A good day is dry-ish dirt, graded trails or natural singletrack, and enough descent to make the climbs worth it.",
    types: ["Trail-centre flow", "Natural singletrack", "Downhill/uplift", "Enduro", "Cross-country", "Bikepacking"],
    idealTempMin: 6,
    idealTempMax: 24,
    coldPenalty: 1.2,
    heatPenalty: 1.5,
    rainPerMm: 7,
    rainProb: 8,
    windOver: 35,
    windPerKmh: 0.8,
    severeWeather: 30,
  },

  // The most weather-tolerant. Cooler is actually better; light rain is fine.
  running: {
    id: "running",
    label: "Running",
    emoji: "🏃",
    description:
      "A good day is firm, traffic-free ground and a clear loop — parkland, woodland or downland — to settle into a rhythm.",
    types: ["Road", "Parkrun", "Long run", "Hill reps", "Intervals"],
    idealTempMin: 4,
    idealTempMax: 18,
    coldPenalty: 1,
    heatPenalty: 2.5,
    rainPerMm: 4,
    rainProb: 5,
    windOver: 35,
    windPerKmh: 0.7,
    severeWeather: 25,
  },

  // Like running but a touch more affected by heavy rain (mud, footing).
  "trail-running": {
    id: "trail-running",
    label: "Trail running",
    emoji: "🥾",
    description:
      "A good day is off-road terrain with climb and reward — ridgelines, coast paths and forest singletrack that mix views with technical footing.",
    types: ["Fell/mountain", "Coastal path", "Forest singletrack", "Ultra-distance", "Skyrunning"],
    idealTempMin: 4,
    idealTempMax: 20,
    coldPenalty: 1,
    heatPenalty: 2.2,
    rainPerMm: 5,
    rainProb: 6,
    windOver: 35,
    windPerKmh: 0.8,
    severeWeather: 28,
  },
};

/** WMO weather codes that are genuinely bad to be out in. */
function isSevere(code: number): boolean {
  // 71–77 snow, 85–86 snow showers, 95–99 thunderstorm, 65/67 heavy rain/sleet.
  return (
    (code >= 71 && code <= 77) ||
    code === 85 ||
    code === 86 ||
    (code >= 95 && code <= 99) ||
    code === 65 ||
    code === 67
  );
}

/**
 * Score how suitable a day's weather is for an activity, 0–100.
 * Pure function of the tunable config above + the day's forecast summary.
 */
export function scoreWeather(activity: ActivityId, w: DayWeather): number {
  const cfg = ACTIVITIES[activity];
  let score = 100;

  // Temperature: penalise the daytime high being outside the comfort band.
  if (w.tempMax < cfg.idealTempMin) {
    score -= (cfg.idealTempMin - w.tempMax) * cfg.coldPenalty;
  } else if (w.tempMax > cfg.idealTempMax) {
    score -= (w.tempMax - cfg.idealTempMax) * cfg.heatPenalty;
  }

  // Rain: both accumulation and probability matter.
  score -= w.precipSum * cfg.rainPerMm;
  score -= (w.precipProbMax / 100) * cfg.rainProb;

  // Wind: only above each activity's threshold, judged on gusts.
  if (w.gustMax > cfg.windOver) {
    score -= (w.gustMax - cfg.windOver) * cfg.windPerKmh;
  }

  // Severe weather: flat extra hit.
  if (isSevere(w.weatherCode)) {
    score -= cfg.severeWeather;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
