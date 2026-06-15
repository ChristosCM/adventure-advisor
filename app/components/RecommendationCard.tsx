"use client";

import { useState } from "react";
import type { Recommendation } from "@/lib/types";
import { describeWeather } from "@/lib/weatherCodes";
import { formatNice } from "@/lib/dates";
import { reasonFor, groundConditions } from "@/lib/summary";
import { HourlyStrip, bestWindowText } from "@/app/components/HourlyStrip";

function scoreColor(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 55) return "bg-lime-500";
  if (score >= 35) return "bg-amber-500";
  if (score >= 15) return "bg-orange-500";
  return "bg-rose-500";
}

function driveLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const groundTone: Record<string, string> = {
  good: "text-emerald-600 dark:text-emerald-400",
  ok: "text-amber-600 dark:text-amber-400",
  bad: "text-rose-600 dark:text-rose-400",
};

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
      {children}
    </span>
  );
}

export function RecommendationCard({
  rec,
  rank,
}: {
  rec: Recommendation;
  rank: number;
}) {
  const [open, setOpen] = useState(false);
  const w = rec.weather;
  const wx = describeWeather(w.weatherCode);
  const ground = groundConditions(w.recentPrecipMm, rec.activity);

  return (
    <div className="group flex gap-4 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#131a2c]/70 dark:shadow-none dark:hover:border-white/20">
      {/* Score */}
      <div className="flex flex-col items-center justify-center">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
          #{rank}
        </span>
        <div
          className={`mt-1 flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white ${scoreColor(
            rec.finalScore,
          )}`}
          title={`Weather ${rec.weatherScore} − drive ${rec.drivePenalty} = ${rec.finalScore}`}
        >
          {rec.finalScore}
        </div>
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-50">
              <span className="mr-1.5">{rec.emoji}</span>
              {rec.activityLabel}
            </h3>
            <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
              📍 {rec.location.name}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
            {formatNice(rec.date)}
          </span>
        </div>

        <p className="mt-2 text-xs font-medium text-indigo-600 dark:text-cyan-400">
          {reasonFor(rec)} · ⏱ {bestWindowText(rec.activity, w)}
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip>
            {wx.icon} {wx.label}
          </Chip>
          <Chip>🌡️ {Math.round(w.tempMin)}–{Math.round(w.tempMax)}°</Chip>
          <Chip>
            🌧️ {w.precipProbMax}%{w.precipSum > 0 ? ` · ${w.precipSum}mm` : ""}
          </Chip>
          <Chip>💨 {w.gustMax} km/h</Chip>
          <Chip>
            🚗 {rec.drive.estimated ? "~" : ""}
            {driveLabel(rec.drive.minutes)}
          </Chip>
          {ground && (
            <span
              className={`inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium dark:bg-white/5 ${groundTone[ground.tone]}`}
              title={ground.detail}
            >
              {ground.icon} {ground.label}
            </span>
          )}
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-2 text-xs font-medium text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
        >
          {open ? "▴ Hide hourly" : "▾ Hourly forecast"}
        </button>

        {open && (
          <div className="mt-2">
            <HourlyStrip activity={rec.activity} day={w} />
            {w.sunrise && w.sunset && (
              <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                Daylight {w.sunrise}–{w.sunset}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
