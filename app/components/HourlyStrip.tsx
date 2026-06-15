import type { ActivityId, DayWeather } from "@/lib/types";
import { bestWindow, formatWindow, scoredDaylightHours } from "@/lib/window";

function cellColor(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 55) return "bg-lime-500";
  if (score >= 35) return "bg-amber-500";
  if (score >= 15) return "bg-orange-500";
  return "bg-rose-500";
}

/**
 * A compact hour-by-hour suitability heatmap for one day, with the best
 * contiguous window highlighted. `tone="light"` renders for the gradient
 * hero card (light text); otherwise it adapts to the card surface.
 */
export function HourlyStrip({
  activity,
  day,
  tone = "card",
}: {
  activity: ActivityId;
  day: DayWeather;
  tone?: "card" | "light";
}) {
  const hours = scoredDaylightHours(activity, day);
  if (hours.length === 0) return null;
  const win = bestWindow(activity, day);
  const inWin = (h: number) =>
    win ? h >= win.startHour && h <= win.endHour : false;

  const labelColor =
    tone === "light" ? "text-white/80" : "text-slate-400 dark:text-slate-500";

  return (
    <div>
      {/* heatmap */}
      <div className="flex gap-px overflow-hidden rounded-md">
        {hours.map((h) => (
          <div
            key={h.hour}
            title={`${String(h.hour).padStart(2, "0")}:00 · ${Math.round(
              h.point.temp,
            )}° · ${h.point.precipProb}% rain · ${Math.round(
              h.point.gust,
            )} km/h gust · suitability ${h.score}`}
            className={`h-6 flex-1 ${cellColor(h.score)} ${
              inWin(h.hour) ? "" : "opacity-40"
            }`}
          />
        ))}
      </div>
      {/* hour labels (every 3h) */}
      <div className="mt-1 flex gap-px">
        {hours.map((h) => (
          <div
            key={h.hour}
            className={`flex-1 text-center text-[9px] tabular-nums ${labelColor}`}
          >
            {h.hour % 3 === 0 ? String(h.hour).padStart(2, "0") : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Short text for the best window, e.g. "Best window 09:00–14:00 (5h)". */
export function bestWindowText(activity: ActivityId, day: DayWeather): string {
  const win = bestWindow(activity, day);
  if (!win) return "No clear good window — marginal most of the day";
  return `Best window ${formatWindow(win)} (${win.length}h)`;
}
