/** FieldData's own four tools, typed. Everything else is the package's standard tools. */

import { callTool, type CallOptions } from "@tollbooth-dpyc/web";
import { answered } from "./answered";

export interface Reading {
  station_id: string;
  vendor: string;
  sensor_kind: string;
  channel: number | null;
  channel_name: string | null;
  quantity: number;
  unit: string;
  observed_at: string;
}

export interface Station {
  station_id: string;
  vendor: string;
  name: string;
  timezone: string;
  model: string;
}

export interface Series {
  sensor_kind: string;
  channel: number | null;
  channel_name: string | null;
  unit: string;
  points: [string, number][];
}

export interface SummaryDay {
  date: string;
  samples: number;
  temp_min_c: number | null;
  temp_max_c: number | null;
  temp_mean_c: number | null;
  frost_hours: number | null;
  degree_days: number | null;
  rain_mm: number | null;
}

export interface Summary {
  base_c: number;
  days: SummaryDay[];
  total: number;
  page: number;
  page_size: number;
}

export interface SummaryPage {
  sortCol: string;
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
}

export interface NearbyStation extends Station {
  latitude: number;
  longitude: number;
  distance_km: number;
  choice: string;
  chosen: boolean;
  readings: Reading[];
}

export const listStations = (opts?: CallOptions) =>
  callTool<{ stations: Station[]; unavailable: string[] }>("list_stations", {}, opts).then(answered);

export const nearbyStations = (latitude: number, longitude: number, radiusKm: number, opts?: CallOptions) =>
  callTool<{ stations: NearbyStation[] }>("nearby_stations", { latitude, longitude, radius_km: radiusKm }, opts).then(answered);

export const currentReadings = (station: string, opts?: CallOptions) =>
  callTool<{ station: Station; readings: Reading[] }>("current", { station }, opts).then(answered);

export const readingHistory = (station: string, start: string, end: string, sensorKind: string, opts?: CallOptions) =>
  callTool<{ series: Series[] }>("history", { station, start, end, sensor_kind: sensorKind }, opts).then(answered);

export const dailySummary = (station: string, startDate: string, endDate: string, baseC: number, at: SummaryPage, opts?: CallOptions) =>
  callTool<Summary>("summary", {
    station, start_date: startDate, end_date: endDate, base_c: baseC,
    sort_col: at.sortCol, sort_dir: at.sortDir, page: at.page, page_size: at.pageSize,
  }, opts).then(answered);
