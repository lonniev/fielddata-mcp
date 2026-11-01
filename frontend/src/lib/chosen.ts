/** A patron's chosen stations, as the service saves them: vendor:lat:lon:short_id. */

export const shortStationId = (stationId: string) => stationId.replaceAll("-", "").slice(0, 15);

export const shortOfChoice = (choice: string) => choice.split(":").at(-1) ?? "";

export const isChosen = (chosen: readonly string[], stationId: string) =>
  chosen.some((c) => shortOfChoice(c) === shortStationId(stationId));

/** The list with this station added, or taken out if it is there. */
export function toggleChoice(chosen: readonly string[], choice: string): string[] {
  const short = shortOfChoice(choice);
  return chosen.some((c) => shortOfChoice(c) === short)
    ? chosen.filter((c) => shortOfChoice(c) !== short)
    : [...chosen, choice];
}

/** The degrees of a place as a choice stores them. */
const PLACE_UNITS = 10000;

export interface ChosenRow {
  choice: string;
  short: string;
  vendor: string;
  latitude: number | null;
  longitude: number | null;
}

/** A choice read on its own, so a station shows and can be removed whether or not it answers today. */
export function chosenRow(choice: string): ChosenRow {
  const [vendor = "", lat = "", lon = ""] = choice.split(":");
  const latitude = Number(lat) / PLACE_UNITS;
  const longitude = Number(lon) / PLACE_UNITS;
  const placed = lat !== "" && lon !== "" && Number.isFinite(latitude) && Number.isFinite(longitude);
  return {
    choice,
    short: shortOfChoice(choice),
    vendor,
    latitude: placed ? latitude : null,
    longitude: placed ? longitude : null,
  };
}
