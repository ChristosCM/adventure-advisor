import type { Recommendation } from "@/lib/types";
import { describeWeather } from "@/lib/weatherCodes";
import { formatNice } from "@/lib/dates";
import { reasonFor, groundConditions } from "@/lib/summary";
import { HourlyStrip, bestWindowText } from "@/app/components/HourlyStrip";

function driveLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
      {children}
    </span>
  );
}

export function HeroCard({ rec }: { rec: Recommendation }) {
  const w = rec.weather;
  const wx = describeWeather(w.weatherCode);
  const ground = groundConditions(w.recentPrecipMm, rec.activity);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-cyan-500 p-5 text-white shadow-lg">
      {/* decorative glow */}
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-amber-300/30 blur-2xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide backdrop-blur-sm">
            ⭐ Top pick · {formatNice(rec.date)}
          </span>
          <h2 className="mt-2 truncate text-2xl font-bold">
            <span className="mr-1.5">{rec.emoji}</span>
            {rec.activityLabel}
          </h2>
          <p className="truncate text-sm text-white/85">📍 {rec.location.name}</p>
          <p className="mt-1 text-sm font-medium text-white/95">
            {reasonFor(rec)}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-amber-200">
            ⏱ {bestWindowText(rec.activity, w)}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-extrabold backdrop-blur-sm">
            {rec.finalScore}
          </div>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-white/70">
            score
          </span>
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-1.5">
        <Pill>
          {wx.icon} {wx.label}
        </Pill>
        <Pill>🌡️ {Math.round(w.tempMin)}–{Math.round(w.tempMax)}°</Pill>
        <Pill>
          🌧️ {w.precipProbMax}%{w.precipSum > 0 ? ` · ${w.precipSum}mm` : ""}
        </Pill>
        <Pill>💨 {w.gustMax} km/h</Pill>
        <Pill>
          🚗 {rec.drive.estimated ? "~" : ""}
          {driveLabel(rec.drive.minutes)} · {rec.drive.km} km
        </Pill>
        {w.sunrise && w.sunset && (
          <Pill>
            🌅 {w.sunrise}–{w.sunset}
          </Pill>
        )}
        {ground && (
          <Pill>
            {ground.icon} {ground.label}
          </Pill>
        )}
      </div>

      <div className="relative mt-4">
        <HourlyStrip activity={rec.activity} day={w} tone="light" />
      </div>
    </div>
  );
}
