import { NextRequest, NextResponse } from "next/server";
import locations from "@/data/locations.json";
import { ACTIVITIES, scoreWeather } from "@/data/activities";
import { config } from "@/data/config";
import { getWeather } from "@/lib/weather";
import { getDrive } from "@/lib/routing";
import type {
  Location,
  Recommendation,
  RecommendResponse,
} from "@/lib/types";

const LOCATIONS = locations as Location[];

/**
 * GET /api/recommend?dates=2026-06-20,2026-06-21
 *
 * For every (location, supported activity, date) combination, fetches the
 * forecast + drive time, scores it, and returns the list ranked by final
 * score (weather suitability minus drive-time penalty).
 */
export async function GET(req: NextRequest) {
  const datesParam = req.nextUrl.searchParams.get("dates") ?? "";
  const dates = datesParam
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s));

  if (dates.length === 0) {
    return NextResponse.json(
      { error: "Provide ?dates=YYYY-MM-DD,YYYY-MM-DD" },
      { status: 400 },
    );
  }

  const errors: string[] = [];
  const recommendations: Recommendation[] = [];

  // Fetch weather + drive for every location in parallel.
  const perLocation = await Promise.all(
    LOCATIONS.map(async (loc) => {
      const [weatherRes, driveRes] = await Promise.allSettled([
        getWeather(loc.lat, loc.lon, dates),
        getDrive(loc.lat, loc.lon),
      ]);

      if (weatherRes.status === "rejected") {
        errors.push(`Weather failed for ${loc.name}`);
        return null;
      }
      if (driveRes.status === "rejected") {
        errors.push(`Drive lookup failed for ${loc.name}`);
        return null;
      }
      return { loc, weather: weatherRes.value, drive: driveRes.value };
    }),
  );

  for (const entry of perLocation) {
    if (!entry) continue;
    const { loc, weather, drive } = entry;
    const drivePenalty =
      (drive.minutes / 30) * config.driveTimePenaltyPer30Min;

    for (const date of dates) {
      const dayWeather = weather.get(date);
      if (!dayWeather) continue;

      for (const activity of loc.activities) {
        const cfg = ACTIVITIES[activity];
        if (!cfg) continue;
        const weatherScore = scoreWeather(activity, dayWeather);

        recommendations.push({
          activity,
          activityLabel: cfg.label,
          emoji: cfg.emoji,
          location: loc,
          date,
          weather: dayWeather,
          drive,
          weatherScore,
          drivePenalty: Math.round(drivePenalty),
          finalScore: Math.round(weatherScore - drivePenalty),
        });
      }
    }
  }

  recommendations.sort((a, b) => b.finalScore - a.finalScore);

  const body: RecommendResponse = { recommendations, dates, errors };
  return NextResponse.json(body);
}
