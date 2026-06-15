import type { ActivityId, Recommendation } from "@/lib/types";

export type SortKey = "score" | "drive" | "weather";

export interface GroundConditions {
  label: string;
  icon: string;
  tone: "good" | "ok" | "bad";
  detail: string; // e.g. "3mm in last 48h"
}

/** Interpret antecedent rainfall as trail/rock conditions. */
export function groundConditions(
  recentPrecipMm: number | null,
  activity: ActivityId,
): GroundConditions | null {
  if (recentPrecipMm == null) return null;
  const detail = `${recentPrecipMm}mm last 48h`;
  if (recentPrecipMm < 2) {
    return { label: "Dry ground", icon: "🌱", tone: "good", detail };
  }
  if (recentPrecipMm < 10) {
    const label = activity === "climbing" ? "Rock may be greasy" : "Damp underfoot";
    return { label, icon: "💧", tone: "ok", detail };
  }
  const label = activity === "climbing" ? "Wet rock likely" : "Wet & muddy";
  return { label, icon: "🟤", tone: "bad", detail };
}

/** A one-line, honest read on how good the chosen day(s) are overall. */
export function verdict(topScore: number): { text: string; icon: string } {
  if (topScore >= 75) return { icon: "🟢", text: "Cracking weekend — get out there." };
  if (topScore >= 55) return { icon: "🟢", text: "Solid options this weekend." };
  if (topScore >= 35) return { icon: "🟡", text: "Mixed bag — pick your window carefully." };
  if (topScore >= 15) return { icon: "🟠", text: "Rough — manage your expectations." };
  return { icon: "🔴", text: "Grim out there. Maybe a rest day?" };
}

/** A short, human "why" for a recommendation, e.g. "Dry & mild · 41 min drive". */
export function reasonFor(rec: Recommendation): string {
  const w = rec.weather;

  // Weather descriptor.
  const wet =
    w.precipProbMax < 20 ? "Dry" : w.precipProbMax < 55 ? "A bit damp" : "Wet";
  const temp =
    w.tempMax < 4
      ? "cold"
      : w.tempMax > 26
        ? "hot"
        : w.tempMax < 12
          ? "cool"
          : "mild";
  let weather = `${wet} & ${temp}`;
  if (w.gustMax >= 45) weather += ", windy";

  // Drive descriptor.
  const d = rec.drive.minutes;
  const h = Math.floor(d / 60);
  const m = d % 60;
  const driveTime = h > 0 ? `${h}h ${m}m` : `${m} min`;
  const drive =
    d <= 45
      ? `${driveTime} drive`
      : d <= 105
        ? `${driveTime} drive`
        : `${driveTime} — long haul`;

  return `${weather} · ${rec.drive.estimated ? "~" : ""}${drive}`;
}

export function sortRecs(list: Recommendation[], by: SortKey): Recommendation[] {
  const c = [...list];
  if (by === "drive") c.sort((a, b) => a.drive.minutes - b.drive.minutes);
  else if (by === "weather") c.sort((a, b) => b.weatherScore - a.weatherScore);
  else c.sort((a, b) => b.finalScore - a.finalScore);
  return c;
}
