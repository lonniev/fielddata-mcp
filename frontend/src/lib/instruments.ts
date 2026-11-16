/**
 * Which instrument draws each kind of reading, and over what scale. Scales are
 * in the SI the service reports; a reading off the scale pins the needle and
 * still shows its true figure.
 */

import { tr } from "../i18n/index.ts";

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
  /** In the language on screen when the spec was asked for. */
  name: string;
  min: number;
  max: number;
  /** Labelled divisions across the scale. */
  divisions: number;
}

const SPECS: Record<SensorKind, Omit<InstrumentSpec, "name">> = {
  air_temperature: { form: "tube", min: -30, max: 50, divisions: 8 },
  wind_speed: { form: "dial", min: 0, max: 40, divisions: 4 },
  wind_direction: { form: "compass", min: 0, max: 360, divisions: 8 },
  pressure: { form: "dial", min: 950, max: 1050, divisions: 5 },
  relative_humidity: { form: "dial", min: 0, max: 100, divisions: 5 },
  rain_total: { form: "cylinder", min: 0, max: 100, divisions: 5 },
  rain_rate: { form: "dial", min: 0, max: 50, divisions: 5 },
  solar_radiation: { form: "dial", min: 0, max: 1200, divisions: 4 },
  uv_index: { form: "dial", min: 0, max: 12, divisions: 4 },
  soil_temperature: { form: "tube", min: -10, max: 40, divisions: 5 },
  soil_moisture: { form: "dial", min: 0, max: 100, divisions: 5 },
  leaf_wetness: { form: "dial", min: 0, max: 100, divisions: 5 },
};

/** The panel's reading order: sky first, then water, then the ground. */
export const PANEL_ORDER = Object.keys(SPECS) as SensorKind[];

/** A kind this site does not know yet gets a plain labelled figure, never a broken panel. */
export function instrumentFor(kind: string): InstrumentSpec {
  const known = SPECS[kind as SensorKind];
  if (known) return { ...known, name: tr(`lib.instruments.name.${kind as SensorKind}`) };
  // The service's own id for a kind this site has no word for yet.
  return { form: "readout", name: kind.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase()), min: 0, max: 1, divisions: 0 };
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

const POINTS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"] as const;

export type CompassPoint = (typeof POINTS)[number];

/** A point of the compass as the language on screen prints it. */
export const pointName = (point: CompassPoint) => tr(`lib.instruments.point.${point}`);

export function compassPoint(degrees: number): string {
  const d = ((degrees % 360) + 360) % 360;
  return pointName(POINTS[Math.round(d / 22.5) % 16]);
}

/** The instrument's own name, with the channel when a kind has several probes. */
export function instrumentLabel(kind: string, channel: number | null, channelName: string | null): string {
  const name = instrumentFor(kind).name;
  if (channelName) return tr("lib.instruments.named", { name, channel: channelName });
  return channel == null ? name : tr("lib.instruments.numbered", { name, channel });
}

export const INSTRUMENT_KINDS = PANEL_ORDER;
