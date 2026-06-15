# 🏔️ Adventure Advisor

A small Next.js app that recommends **which adventurous activity to do on a given
weekend, and where**, based on the weather forecast and the driving time from home
(West Kensington, London).

For each candidate location it pulls the forecast, scores how good each supported
activity would be in that weather, subtracts a penalty for the drive, and shows a
ranked list of `(activity @ location)` options plus a map.

## Stack

- **Next.js (App Router) + TypeScript + Tailwind CSS v4**
- **Open-Meteo** forecast API (free, no key) — weather
- **OSRM** public demo server (`router.project-osrm.org`) — drive time, with a
  straight-line haversine fallback if routing fails
- **react-leaflet + OpenStreetMap** — map

There is **no separate backend**. The "server" is a Next.js
[route handler](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
at `app/api/recommend/route.ts` that runs inside the same Next.js process. It calls
the external APIs server-side and caches results per `(lat, lon, date)` for the life
of the server process. You can deploy the whole thing as one unit (Vercel, Fly.io,
a VPS, etc.) with no Python or extra service.

## Run it

```bash
npm install      # already done if you're reading this in the repo
npm run dev      # http://localhost:3000
```

For a production build:

```bash
npm run build
npm start
```

The app fetches recommendations for the upcoming Saturday + Sunday on load. Change
the two dates and click **Find adventures** to re-run.

## Where to edit things

| What | File | Notes |
|------|------|-------|
| **Locations** | `data/locations.json` | name, `lat`, `lon`, supported `activities`, optional `notes`. Add/remove freely; coordinates are rough — refine them. |
| **Activity weather preferences** | `data/activities.ts` | Per-activity tunable weights (ideal temp band, rain/wind penalties, severe-weather hit) and the `scoreWeather()` function. |
| **Home coords & drive penalty** | `data/config.ts` | `home` lat/lon, `driveTimePenaltyPer30Min`, the `daytime` window (daily summary), the `timeline` band (hourly strip), `antecedentDays` (rainfall lookback for ground conditions), and `goodHourThreshold` (when an hour counts as "good" for the best window). |
| **Ground / verdict wording** | `lib/summary.ts` | Rainfall thresholds for dry/damp/wet ground, and the score bands behind the verdict line. |

Activity ids are defined in `lib/types.ts` (`ActivityId`). If you add a new activity,
add it there, give it a config block in `data/activities.ts`, and list it on the
relevant locations.

## How scoring works

1. **Weather suitability (0–100)** — each activity starts at 100 and loses points for
   conditions it dislikes (`data/activities.ts`):
   - **Climbing** heavily penalises rain / wet and rain *probability*; wants dry + mild.
   - **Road cycling** penalises wind (gusts) and rain.
   - **Mountain biking** tolerates damp but penalises heavy rain.
   - **Running / trail running** are the most weather-tolerant; cooler is fine.
   - Temperature outside each activity's comfort band penalises all of them, and
     snow/thunderstorm codes add a flat hit.
2. **Drive penalty** — `(driveMinutes / 30) × driveTimePenaltyPer30Min`.
3. **Final score** = weather suitability − drive penalty (can go negative). All
   `(activity, location, date)` combinations are ranked by final score.

The forecast is summarised over a configurable **daytime window** (default 08:00–18:00
local time at each location) — we only care about the weather while you'd be out.

## Project layout

```
data/
  locations.json     # editable list of spots
  activities.ts      # weather-preference config + scoreWeather()
  config.ts          # home coords, drive penalty weight, daytime window
lib/
  types.ts           # shared types (incl. hourly series + daylight + recent rain)
  weather.ts         # Open-Meteo client: daily summary, hourly band, sunrise/
                     #   sunset, antecedent rainfall, per-(lat,lon,date) cache
  routing.ts         # OSRM client + haversine fallback + cache
  window.ts          # per-hour scoring + daylight-bounded "best window"
  summary.ts         # "why" reason, sort, ground conditions, verdict
  dates.ts           # upcoming-weekend + date formatting helpers
  weatherCodes.ts    # WMO code → label/emoji
app/
  api/recommend/route.ts   # the "backend": fetch, score, rank
  components/
    Logo.tsx                 # SVG mountain+sun brand mark
    ThemeToggle.tsx          # light/dark switch (persists to localStorage)
    SportFilter.tsx          # filter recommendations by activity
    HeroCard.tsx             # featured top pick (window, daylight, ground, strip)
    HourlyStrip.tsx          # hour-by-hour suitability heatmap + best window
    RecommendationCard.tsx   # scannable card + expandable hourly forecast
    MapView.tsx              # react-leaflet (client-only), light/dark tiles
  layout.tsx                 # no-flash theme script
  page.tsx                   # header, date picker, filter, cards + map
  globals.css                # Tailwind v4 + "Alpine Dusk" theme tokens
```

## UI

- **Hourly "best window"** — instead of just rating the whole day, each pick
  scores every daylight hour for that activity and shows the best contiguous
  window to be out (e.g. "Best window 09:00–14:00 (5h)"), plus an expandable
  hour-by-hour heatmap. Built from the hourly forecast we already fetch.
- **Daylight** — sunrise/sunset is shown and used to bound the best window
  (no recommending a slot after dark).
- **Ground conditions** — rainfall over the previous ~48h is read as trail/rock
  state: "Dry ground", "Damp underfoot", or "Wet & muddy" (worded as greasy/wet
  rock for climbing). Genuinely matters for climbing and mountain biking.
- **Honest verdict** — a one-line read on the weekend ("Cracking weekend" …
  "Grim out there, maybe a rest day?") so a bad weekend looks bad, not polished.
- **Top-pick hero card** — the single best recommendation is featured in a
  gradient banner with its score, a plain-language "why", and the key stats.
- **Sort the rest** — toggle the remaining options by *Best overall*, *Best
  weather*, or *Shortest drive*.
- **"Why" in plain language** — each card summarises conditions, e.g.
  "Dry & mild · 41 min drive" (see `lib/summary.ts`).
- **Filter by sport** — chips under the controls filter the list (and the map)
  to one or more activities; "All sports" resets.
- **Light / dark theme** — toggle in the top-right (sun/moon). The choice is
  saved to `localStorage` and applied before paint (no flash); first visit
  follows your OS preference. The map swaps to dark CARTO tiles to match.
- **"Alpine Dusk" look** — a layered gradient-mesh background (soft indigo /
  cyan / amber glows) instead of flat white, with frosted-glass surfaces. An
  indigo→cyan brand gradient with an amber spark ties it together.

## Notes & caveats

- The OSRM demo server is rate-limited and sometimes down; when it fails the app
  silently falls back to a haversine estimate (shown with a `~` and "(est.)").
- Open-Meteo provides roughly 16 days of forecast, so very distant future dates
  won't return data and those locations are skipped.
- Caches are in-memory and reset when the dev server restarts.
