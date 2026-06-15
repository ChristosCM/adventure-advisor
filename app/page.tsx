"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { config } from "@/data/config";
import { upcomingWeekend } from "@/lib/dates";
import type { ActivityId, Recommendation, RecommendResponse } from "@/lib/types";
import { RecommendationCard } from "@/app/components/RecommendationCard";
import { HeroCard } from "@/app/components/HeroCard";
import { Logo } from "@/app/components/Logo";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { SportFilter } from "@/app/components/SportFilter";
import { sortRecs, verdict, type SortKey } from "@/lib/summary";
import type { MapSpot } from "@/app/components/MapView";

const recKey = (r: Recommendation) =>
  `${r.location.name}-${r.activity}-${r.date}`;

const SORTS: { key: SortKey; label: string }[] = [
  { key: "score", label: "Best overall" },
  { key: "weather", label: "Best weather" },
  { key: "drive", label: "Shortest drive" },
];

// Leaflet touches `window`, so load the map only on the client.
const MapView = dynamic(() => import("@/app/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-slate-400">
      Loading map…
    </div>
  ),
});

export default function Home() {
  const [sat, sun] = upcomingWeekend();
  const [day1, setDay1] = useState(sat);
  const [day2, setDay2] = useState(sun);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<Set<ActivityId>>(new Set());
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [dark, setDark] = useState(false);

  // Keep the map's theme in sync with the <html class="dark"> toggle.
  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setDark(el.classList.contains("dark"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const fetchRecs = useCallback(async () => {
    const dates = [day1, day2].filter(Boolean);
    if (dates.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recommend?dates=${dates.join(",")}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data: RecommendResponse = await res.json();
      setRecs(data.recommendations);
      setErrors(data.errors ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setRecs([]);
    } finally {
      setLoading(false);
    }
  }, [day1, day2]);

  // Fetch on first load with the default weekend.
  useEffect(() => {
    fetchRecs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleSport(id: ActivityId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setShowAll(false);
  }

  const filtered = useMemo(
    () =>
      selected.size === 0
        ? recs
        : recs.filter((r) => selected.has(r.activity)),
    [recs, selected],
  );

  // The single best pick (always by overall score) gets featured.
  const hero = useMemo(
    () => (filtered.length ? sortRecs(filtered, "score")[0] : null),
    [filtered],
  );

  // The rest, sorted by the chosen key.
  const rest = useMemo(() => {
    const heroKey = hero ? recKey(hero) : null;
    return sortRecs(filtered, sortBy).filter((r) => recKey(r) !== heroKey);
  }, [filtered, sortBy, hero]);

  const displayed = useMemo(
    () => (showAll ? rest : rest.slice(0, 11)),
    [rest, showAll],
  );

  // One marker per location across hero + displayed (best-scoring per spot).
  const spots = useMemo<MapSpot[]>(() => {
    const byLoc = new Map<string, MapSpot>();
    for (const r of [...(hero ? [hero] : []), ...displayed]) {
      const existing = byLoc.get(r.location.name);
      if (!existing || r.finalScore > existing.score) {
        byLoc.set(r.location.name, {
          name: r.location.name,
          lat: r.location.lat,
          lon: r.location.lon,
          score: r.finalScore,
          topActivity: r.activityLabel,
        });
      }
    }
    return [...byLoc.values()];
  }, [hero, displayed]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Adventure{" "}
              <span className="bg-gradient-to-r from-teal-600 to-orange-500 bg-clip-text text-transparent">
                Advisor
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Best sport · best spot · best weather — from{" "}
              {config.home.name.replace("Home — ", "")}
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Controls */}
      <section className="mb-5 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#0e221d]/70">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col text-sm font-medium text-slate-700 dark:text-slate-300">
            Day 1
            <input
              type="date"
              value={day1}
              onChange={(e) => setDay1(e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:[color-scheme:dark]"
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-700 dark:text-slate-300">
            Day 2
            <input
              type="date"
              value={day2}
              onChange={(e) => setDay2(e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:[color-scheme:dark]"
            />
          </label>
          <button
            onClick={fetchRecs}
            disabled={loading}
            className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-2 font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Checking…" : "Find adventures"}
          </button>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-white/10">
          <SportFilter
            selected={selected}
            onToggle={toggleSport}
            onClear={() => {
              setSelected(new Set());
              setShowAll(false);
            }}
          />
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}
      {errors.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          Some locations were skipped: {errors.join("; ")}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(320px,40%)]">
        <div className="space-y-3">
          {!loading && filtered.length === 0 && !error && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {recs.length === 0
                ? "No recommendations yet — pick two days and hit “Find adventures”."
                : "No options match this sport filter."}
            </p>
          )}

          {hero && (
            <p className="px-1 text-sm font-medium text-slate-600 dark:text-slate-300">
              {verdict(hero.finalScore).icon} {verdict(hero.finalScore).text}
            </p>
          )}

          {hero && <HeroCard rec={hero} />}

          {rest.length > 0 && (
            <div className="flex items-center justify-between pt-1">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                More options
              </h2>
              <div className="flex items-center gap-1 rounded-lg border border-white/60 bg-white/70 p-0.5 text-xs backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSortBy(s.key)}
                    className={
                      "rounded-md px-2.5 py-1 font-medium transition " +
                      (sortBy === s.key
                        ? "bg-gradient-to-r from-teal-600 to-emerald-500 text-white"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100")
                    }
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {displayed.map((rec, i) => (
            <RecommendationCard key={recKey(rec)} rec={rec} rank={i + 2} />
          ))}
          {rest.length > 11 && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="text-sm font-medium text-teal-600 hover:underline dark:text-emerald-400"
            >
              {showAll
                ? "Show fewer"
                : `Show all ${rest.length + 1} options`}
            </button>
          )}
        </div>

        <div className="h-[400px] overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-white/10 lg:sticky lg:top-6 lg:h-[70vh]">
          <MapView
            home={{
              name: config.home.name,
              lat: config.home.lat,
              lon: config.home.lon,
            }}
            spots={spots}
            dark={dark}
          />
        </div>
      </div>

      <footer className="mt-10 text-xs text-slate-400 dark:text-slate-500">
        Weather: Open-Meteo · Routing: OSRM demo server · Map: CARTO /
        OpenStreetMap. Edit <code>data/locations.json</code>,{" "}
        <code>data/activities.ts</code>, and <code>data/config.ts</code> to tune.
      </footer>
    </main>
  );
}
