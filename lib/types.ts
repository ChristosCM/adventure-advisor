export type ActivityId =
  | "mountain-biking"
  | "road-cycling"
  | "running"
  | "trail-running"
  | "climbing";

export interface Location {
  name: string;
  lat: number;
  lon: number;
  activities: ActivityId[];
  notes?: string;
  /** Short area + rough drive time from home, e.g. "Kent · ~1h15". */
  region?: string;
  /** Per-activity specifics — what you actually do here for that sport
   *  (named trails / crags / routes / climbs). Keyed by ActivityId. */
  detail?: Partial<Record<ActivityId, string>>;
}

/** One hour of forecast, used to build the hourly timeline + "best window". */
export interface HourPoint {
  hour: number; // 0–23, local time at the location
  temp: number; // °C
  precip: number; // mm in this hour
  precipProb: number; // %
  gust: number; // km/h
  code: number; // WMO weather code
}

/** A summary of one day's forecast at one location, derived from the
 *  Open-Meteo hourly + daily data over our daytime window. */
export interface DayWeather {
  date: string; // YYYY-MM-DD
  tempMax: number; // °C, daytime high
  tempMin: number; // °C, daytime low
  tempMean: number; // °C, daytime mean
  precipSum: number; // mm over the daytime window
  precipProbMax: number; // %, max hourly precip probability in window
  windMax: number; // km/h, max sustained wind in window
  gustMax: number; // km/h, max gust in window
  weatherCode: number; // worst (highest) WMO code seen in window
  sunrise: string; // "HH:MM" local
  sunset: string; // "HH:MM" local
  recentPrecipMm: number | null; // antecedent ~48h rainfall (null if unavailable)
  hours: HourPoint[]; // hourly series across the timeline band (for the strip)
}

export interface DriveInfo {
  minutes: number; // one-way drive time
  km: number; // one-way distance
  estimated: boolean; // true if OSRM failed and we used haversine fallback
}

export interface Recommendation {
  activity: ActivityId;
  activityLabel: string;
  emoji: string;
  location: Location;
  date: string; // YYYY-MM-DD
  weather: DayWeather;
  drive: DriveInfo;
  weatherScore: number; // 0–100
  drivePenalty: number; // points subtracted
  finalScore: number; // weatherScore − drivePenalty (can be negative)
}

export interface RecommendResponse {
  recommendations: Recommendation[];
  dates: string[];
  errors: string[];
}
