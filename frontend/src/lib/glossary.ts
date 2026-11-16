/** The words this site uses, and what they mean. One source, for the Terms page and every inline definition. */

import { tr, type Translate } from "../i18n/index.ts";
import { formatWhole, type UnitSystem } from "./units.ts";

type Group = "instruments" | "readings" | "arithmetic" | "account";

/** One word, read in the language on screen whenever it is asked for. */
export interface Entry {
  key: string;
  group: Group;
  term: () => string;
  /** Other names a reader may search by; empty when there are none. */
  aka: () => string[];
  said: (units: UnitSystem) => string;
}

export const GROUPS: { id: Group; title: () => string }[] = [
  { id: "instruments", title: () => tr("lib.glossary.group.instruments") },
  { id: "readings", title: () => tr("lib.glossary.group.readings") },
  { id: "arithmetic", title: () => tr("lib.glossary.group.arithmetic") },
  { id: "account", title: () => tr("lib.glossary.group.account") },
];

const temp = (celsius: number, units: UnitSystem) => formatWhole(celsius, "°C", units);

/** The catalog keeps a word's other names in one line, kept apart by " · ". */
const SEPARATOR = " · ";

type Row = [
  key: "air_temperature" | "pressure" | "relative_humidity" | "wind_speed" | "wind_direction" | "rain_total" | "rain_rate"
    | "solar_radiation" | "uv_index" | "soil_moisture" | "soil_temperature" | "leaf_wetness" | "channel" | "gdd" | "base_temp"
    | "frost_hours" | "station" | "nearby_station" | "keys" | "npub" | "sats" | "lightning",
  group: Group,
  aka: boolean,
  said?: (units: UnitSystem, t: Translate) => string,
];

const ROWS: Row[] = [
  ["air_temperature", "instruments", true],
  ["pressure", "instruments", true],
  ["relative_humidity", "instruments", true],
  ["wind_speed", "instruments", true],
  ["wind_direction", "instruments", true],
  ["rain_total", "instruments", true],
  ["rain_rate", "readings", true],
  ["solar_radiation", "instruments", true],
  ["uv_index", "readings", true],
  ["soil_moisture", "readings", true],
  ["soil_temperature", "readings", false],
  ["leaf_wetness", "readings", false],
  ["channel", "readings", true],
  ["gdd", "arithmetic", true],
  ["base_temp", "arithmetic", true, (u, t) => t("lib.glossary.base_temp.said", { corn: temp(10, u), peas: temp(4.5, u) })],
  ["frost_hours", "arithmetic", true, (u, t) => t("lib.glossary.frost_hours.said", { freezing: temp(0, u) })],
  ["station", "account", true],
  ["nearby_station", "account", true],
  ["keys", "account", true],
  ["npub", "account", true],
  ["sats", "account", true],
  ["lightning", "account", true],
];

export const GLOSSARY: Entry[] = ROWS.map(([key, group, hasAka, said]) => ({
  key,
  group,
  term: () => tr(`lib.glossary.${key}.term`),
  aka: () => (hasAka ? tr(`lib.glossary.${key}.aka` as `lib.glossary.${Exclude<Row[0], "soil_temperature" | "leaf_wetness">}.aka`).split(SEPARATOR) : []),
  said: (units) => (said ? said(units, tr) : tr(`lib.glossary.${key}.said`)),
}));

const BY_KEY = new Map(GLOSSARY.map((e) => [e.key, e]));

export const define = (key: string) => BY_KEY.get(key);

export function searchGlossary(query: string, units: UnitSystem): Entry[] {
  const q = query.trim().toLowerCase();
  if (!q) return GLOSSARY;
  return GLOSSARY.filter((e) => [e.term(), ...e.aka(), e.said(units)].some((text) => text.toLowerCase().includes(q)));
}
