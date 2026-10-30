/** Display units. The service speaks SI; a patron may read in US customary units. */

export type UnitSystem = "si" | "us";

export interface Converted {
  value: number;
  unit: string;
  /** Decimal places that suit this unit. */
  places: number;
}

const US: Record<string, (q: number) => Converted> = {
  "°C": (q) => ({ value: (q * 9) / 5 + 32, unit: "°F", places: 1 }),
  hPa: (q) => ({ value: q * 0.02953, unit: "inHg", places: 2 }),
  "m/s": (q) => ({ value: q * 2.23694, unit: "mph", places: 1 }),
  mm: (q) => ({ value: q / 25.4, unit: "in", places: 2 }),
  "mm/h": (q) => ({ value: q / 25.4, unit: "in/h", places: 2 }),
};

const SI_PLACES: Record<string, number> = { "°C": 1, hPa: 1, "m/s": 1, mm: 1, "mm/h": 1, "W/m²": 0, "%": 0, deg: 0 };

export function convert(quantity: number, unit: string, system: UnitSystem): Converted {
  if (system === "us" && US[unit]) return US[unit](quantity);
  return { value: quantity, unit, places: SI_PLACES[unit] ?? 1 };
}

/** "21.4 °C", or just the figure for a unitless index. */
export function formatQuantity(quantity: number, unit: string, system: UnitSystem): string {
  const c = convert(quantity, unit, system);
  const shown = c.unit === "index" ? "" : c.unit === "deg" ? "°" : ` ${c.unit}`;
  return `${c.value.toFixed(c.places)}${shown}`;
}

/** A scale label: whole numbers unless the unit needs its decimals. */
export function formatTick(quantity: number, unit: string, system: UnitSystem): string {
  const c = convert(quantity, unit, system);
  const places = c.unit === "inHg" ? 1 : c.unit === "in" || c.unit === "in/h" ? 1 : 0;
  return c.value.toFixed(places);
}
