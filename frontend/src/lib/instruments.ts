/**
 * Which instrument draws each kind of reading, and over what scale. Scales are
 * in the SI the service reports; a reading off the scale pins the needle and
 * still shows its true figure.
 */

export type SensorKind =
  | "air_temperature"
  | "relative_humidity"
  | "pressure"
  | "wind_speed"
  | "wind_direction"
  | "rain_rate"
  | "rain_total"
  | "solar_radiation"
  | "uv_index"
  | "soil_moisture"
  | "soil_temperature"
  | "leaf_wetness";

export type InstrumentForm = "dial" | "tube" | "compass" | "cylinder" | "readout";

export interface InstrumentSpec {
  form: InstrumentForm;
  name: string;
  min: number;
  max: number;
  /** Labelled divisions across the scale. */
  divisions: number;
}

const SPECS: Record<SensorKind, InstrumentSpec> = {
  air_temperature: { form: "tube", name: "Air", min: -30, max: 50, divisions: 8 },
  wind_speed: { form: "dial", name: "Anemometer", min: 0, max: 40, divisions: 4 },
  wind_direction: { form: "compass", name: "Wind vane", min: 0, max: 360, divisions: 8 },
  pressure: { form: "dial", name: "Barometer", min: 950, max: 1050, divisions: 5 },
  relative_humidity: { form: "dial", name: "Hygrometer", min: 0, max: 100, divisions: 5 },
  rain_total: { form: "cylinder", name: "Rain gauge", min: 0, max: 100, divisions: 5 },
  rain_rate: { form: "dial", name: "Rain rate", min: 0, max: 50, divisions: 5 },
  solar_radiation: { form: "dial", name: "Pyranometer", min: 0, max: 1200, divisions: 4 },
  uv_index: { form: "dial", name: "UV index", min: 0, max: 12, divisions: 4 },
  soil_temperature: { form: "tube", name: "Soil", min: -10, max: 40, divisions: 5 },
  soil_moisture: { form: "dial", name: "Soil moisture", min: 0, max: 100, divisions: 5 },
  leaf_wetness: { form: "dial", name: "Leaf wetness", min: 0, max: 100, divisions: 5 },
};

/** The panel's reading order: sky first, then water, then the ground. */
export const PANEL_ORDER = Object.keys(SPECS) as SensorKind[];

/** A kind this site does not know yet gets a plain labelled figure, never a broken panel. */
export function instrumentFor(kind: string): InstrumentSpec {
  return (
    SPECS[kind as SensorKind] ?? {
      form: "readout",
      name: kind.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase()),
      min: 0,
      max: 1,
      divisions: 0,
    }
  );
}

/** Where a quantity sits on a scale, 0..1, pinned at the ends. */
export function scaleRatio(quantity: number, min: number, max: number): number {
  if (!Number.isFinite(quantity) || max <= min) return 0;
  return Math.min(1, Math.max(0, (quantity - min) / (max - min)));
}

/** A dial sweeps 270°: from -135° at the bottom left to +135° at the bottom right. */
export function needleAngle(ratio: number): number {
  return -135 + 270 * ratio;
}

/** The point on a circle at an angle measured clockwise from twelve o'clock. */
export function polar(cx: number, cy: number, r: number, degrees: number): [number, number] {
  const a = ((degrees - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

const POINTS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

export function compassPoint(degrees: number): string {
  const d = ((degrees % 360) + 360) % 360;
  return POINTS[Math.round(d / 22.5) % 16];
}

/** The instrument's own name, with the channel when a kind has several probes. */
export function instrumentLabel(kind: string, channel: number | null, channelName: string | null): string {
  const name = instrumentFor(kind).name;
  if (channelName) return `${name}: ${channelName}`;
  return channel == null ? name : `${name} ${channel}`;
}
