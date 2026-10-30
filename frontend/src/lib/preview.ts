/** A panel with no station behind it: a made-up farm, for a patron whose own station has not reported yet. */

import type { Reading, Series, SummaryDay } from "./field";

const HOUR_MS = 60 * 60 * 1000;

const ROWS: [string, number | null, string | null, number, string][] = [
  ["air_temperature", null, null, 18.4, "°C"],
  ["relative_humidity", null, null, 64, "%"],
  ["pressure", null, null, 1016.5, "hPa"],
  ["wind_speed", null, null, 3.2, "m/s"],
  ["wind_direction", null, null, 292, "deg"],
  ["rain_rate", null, null, 0.4, "mm/h"],
  ["rain_total", null, null, 22.5, "mm"],
  ["solar_radiation", null, null, 420, "W/m²"],
  ["uv_index", null, null, 4, "index"],
  ["soil_moisture", 1, "Vineyard row 4", 34, "%"],
  ["soil_moisture", 2, "Kitchen garden", 41, "%"],
  ["soil_temperature", 1, "Vineyard row 4", 14.2, "°C"],
  ["leaf_wetness", 1, "North field", 18, "%"],
];

export function previewReadings(now: number): Reading[] {
  return ROWS.map(([sensor_kind, channel, channel_name, quantity, unit]) => ({
    station_id: "preview",
    vendor: "preview",
    sensor_kind,
    channel,
    channel_name,
    quantity,
    unit,
    observed_at: new Date(now).toISOString(),
  }));
}

/** How far each instrument plausibly moves in a day, in its own unit. */
const DAILY_SWING: Record<string, number> = { pressure: 4, air_temperature: 6, soil_temperature: 1.5, relative_humidity: 15, soil_moisture: 2, wind_direction: 40 };

/** A day's trace ending on the reading: a daily swing with a little ripple. */
export function previewSeries(reading: Reading, now: number): Series {
  const swing = DAILY_SWING[reading.sensor_kind] ?? Math.max(reading.quantity * 0.6, 0.5);
  const points = Array.from({ length: 97 }, (_, i): [string, number] => {
    const back = (96 - i) / 96;
    const wave = Math.sin(back * 2 * Math.PI) + 0.12 * Math.sin(back * 37);
    return [new Date(now - back * 24 * HOUR_MS).toISOString(), Math.max(0, reading.quantity + swing * wave)];
  });
  return { sensor_kind: reading.sensor_kind, channel: reading.channel, channel_name: reading.channel_name, unit: reading.unit, points };
}

const WEEK: [number, number, number, number, number][] = [
  [9.1, 19.4, 0, 0, 4.3],
  [11.2, 21.0, 0, 2.5, 6.1],
  [7.8, 16.3, 0, 11.0, 2.1],
  [-1.2, 12.8, 2.5, 0, 0.8],
  [3.4, 15.1, 0, 0, 0],
  [6.6, 18.9, 0, 0.5, 2.8],
  [8.0, 18.4, 0, 8.5, 3.2],
];

/** The last seven days, newest first. */
export function previewDays(now: number): SummaryDay[] {
  return WEEK.map(([low, high, frost, rain, degrees], i) => ({
    date: new Date(now - (WEEK.length - 1 - i) * 24 * HOUR_MS).toISOString().slice(0, 10),
    samples: 48,
    temp_min_c: low,
    temp_max_c: high,
    temp_mean_c: Math.round(((low + high) / 2) * 10) / 10,
    frost_hours: frost,
    degree_days: degrees,
    rain_mm: rain,
  })).reverse();
}
