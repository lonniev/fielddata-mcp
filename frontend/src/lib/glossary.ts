/** The words this site uses, and what they mean. One source, for the Terms page and every inline definition. */

import { formatWhole, type UnitSystem } from "./units.ts";

export interface Entry {
  key: string;
  term: string;
  group: "instruments" | "readings" | "arithmetic" | "account";
  aka?: string[];
  said: (units: UnitSystem) => string;
}

export const GROUPS: { id: Entry["group"]; title: string }[] = [
  { id: "instruments", title: "Instruments" },
  { id: "readings", title: "Readings" },
  { id: "arithmetic", title: "The log's arithmetic" },
  { id: "account", title: "Your account" },
];

const temp = (celsius: number, units: UnitSystem) => formatWhole(celsius, "°C", units);

export const GLOSSARY: Entry[] = [
  { key: "air_temperature", term: "Thermometer", group: "instruments", aka: ["air temperature"], said: () => "Measures the temperature of the air around the station's sensor, which is usually sheltered from direct sun." },
  { key: "pressure", term: "Barometer", group: "instruments", aka: ["barometric pressure", "relative pressure"], said: () => "Measures the weight of the air above the station, adjusted to sea level so places can be compared. A falling barometer often comes before unsettled weather." },
  { key: "relative_humidity", term: "Hygrometer", group: "instruments", aka: ["relative humidity"], said: () => "Measures how much water the air holds, as a share of the most it could hold at that temperature." },
  { key: "wind_speed", term: "Anemometer", group: "instruments", aka: ["wind speed"], said: () => "Measures how fast the air is moving, usually from a set of spinning cups." },
  { key: "wind_direction", term: "Wind vane", group: "instruments", aka: ["wind direction"], said: () => "Shows the direction the wind is blowing from, so a west wind comes out of the west." },
  { key: "rain_total", term: "Rain gauge", group: "instruments", aka: ["rainfall", "rain total"], said: () => "Measures how much rain has fallen, as the depth it would reach on flat ground. The figure here is the running total for the day." },
  { key: "rain_rate", term: "Rain rate", group: "readings", aka: ["rainfall rate"], said: () => "How hard it is raining right now, as the depth that would fall in an hour at this pace." },
  { key: "solar_radiation", term: "Pyranometer", group: "instruments", aka: ["solar radiation", "irradiance", "W/m²"], said: () => "Measures the sunlight reaching the sensor, as power on each square meter of ground." },
  { key: "uv_index", term: "UV index", group: "readings", aka: ["UV", "ultraviolet"], said: () => "A scale for the sunburning strength of the sun's ultraviolet light. Higher means skin burns sooner." },
  { key: "soil_moisture", term: "Soil moisture", group: "readings", aka: ["soil humidity"], said: () => "How wet the soil is around a buried probe. The percentage is the probe's own scale, so it is best read against the same probe on other days." },
  { key: "soil_temperature", term: "Soil temperature", group: "readings", said: () => "The temperature of the ground around a probe. Seeds and roots respond to it more than to the air." },
  { key: "leaf_wetness", term: "Leaf wetness", group: "readings", said: () => "How wet a sensor shaped like a leaf is. Long wet spells on leaves are when many fungal diseases take hold." },
  { key: "channel", term: "Channel", group: "readings", aka: ["probe number"], said: () => "The number that tells one sensor from another of the same kind on a station, such as two soil probes." },
  { key: "gdd", term: "Degree-days", group: "arithmetic", aka: ["GDD", "growing degree days", "degree day"], said: () => "A day's warmth above the temperature a plant starts growing at: the day's low and high averaged, less that base, and never below zero. They add up through a season, which is why a crop is paced by heat more than by the calendar." },
  { key: "base_temp", term: "Base temperature", group: "arithmetic", aka: ["base"], said: (u) => `The temperature below which a plant does no growing. It belongs to the crop: field corn counts from ${temp(10, u)} and peas from about ${temp(4.5, u)}.` },
  { key: "frost_hours", term: "Frost hours", group: "arithmetic", aka: ["frost"], said: (u) => `How long the air stayed at or below ${temp(0, u)} that day, added up from the station's half-hour samples.` },
  { key: "station", term: "Station", group: "account", aka: ["gateway", "console"], said: () => "A device that reports readings to a vendor's service, with whatever sensors are paired to it." },
  { key: "nearby_station", term: "Nearby station", group: "account", aka: ["public station"], said: () => "A station whose owner publishes it. Once you tick one, it joins your stations." },
  { key: "keys", term: "Application Key and API Key", group: "account", aka: ["API key", "keys"], said: () => "The pair your weather vendor issues so a service can read your account. You make them on the vendor's site, and you can delete them there at any time." },
  { key: "npub", term: "npub", group: "account", aka: ["Nostr key", "Nostr"], said: () => "Your public identity on Nostr, in place of a username. Its secret half, the nsec, stays with you." },
  { key: "sats", term: "Sats", group: "account", aka: ["satoshi", "api_sats"], said: () => "Small units of Bitcoin. FieldData's tool fees are paid from your balance of them." },
  { key: "lightning", term: "Lightning", group: "account", aka: ["Bitcoin Lightning", "invoice"], said: () => "A network for paying small amounts of Bitcoin quickly. You top up by paying a Lightning invoice from your wallet." },
];

const BY_KEY = new Map(GLOSSARY.map((e) => [e.key, e]));

export const define = (key: string) => BY_KEY.get(key);

export function searchGlossary(query: string, units: UnitSystem): Entry[] {
  const q = query.trim().toLowerCase();
  if (!q) return GLOSSARY;
  return GLOSSARY.filter((e) => [e.term, ...(e.aka ?? []), e.said(units)].some((text) => text.toLowerCase().includes(q)));
}
