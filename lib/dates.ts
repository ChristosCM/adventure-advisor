/** Date helpers. All formatting is done in local time as YYYY-MM-DD. */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * The upcoming weekend as [Saturday, Sunday] ISO dates.
 * If today is already Sat/Sun, returns the current weekend.
 */
export function upcomingWeekend(today = new Date()): [string, string] {
  const d = new Date(today);
  const dow = d.getDay(); // 0 Sun … 6 Sat
  // Days until Saturday (if today is Sunday, this weekend's Saturday was yesterday).
  let untilSat = (6 - dow + 7) % 7;
  if (dow === 0) untilSat = -1; // Sunday: Saturday was yesterday
  const sat = new Date(d);
  sat.setDate(d.getDate() + untilSat);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  return [toISODate(sat), toISODate(sun)];
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "Sat 20 Jun" from an ISO date string (parsed as local). */
export function formatNice(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${DOW[date.getDay()]} ${d} ${MON[m - 1]}`;
}
