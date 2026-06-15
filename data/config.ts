/**
 * Global configuration — tune these values freely.
 *
 * `home` is where drive times are measured from (West Kensington, London).
 * `driveTimePenaltyPer30Min` is subtracted from the weather-suitability score
 * for every 30 minutes of one-way driving. Higher = stronger bias toward
 * nearby spots. e.g. 10 means a 2-hour drive costs 40 points (out of 100).
 */
export const config = {
  home: {
    name: "Home — West Kensington",
    lat: 51.49,
    lon: -0.206,
  },

  /** Points subtracted from the score per 30 minutes of one-way drive time. */
  driveTimePenaltyPer30Min: 10,

  /**
   * Daytime window (24h, local time at the location) used to summarise the
   * hourly forecast into the daily score. We only care about weather while
   * we'd actually be out.
   */
  daytime: {
    startHour: 8,
    endHour: 18,
  },

  /**
   * Wider band shown in the hourly timeline / used to find the "best window".
   * Bounded at render time to the actual daylight hours (sunrise–sunset).
   */
  timeline: {
    startHour: 6,
    endHour: 21,
  },

  /** How many days of rainfall before the chosen day count as "ground conditions". */
  antecedentDays: 2,

  /** Hourly suitability (0–100) at or above which an hour counts as "good". */
  goodHourThreshold: 55,
} as const;
