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

/** Take a station out when only its id is known. */
export const withoutStation = (chosen: readonly string[], stationId: string) =>
  chosen.filter((c) => shortOfChoice(c) !== shortStationId(stationId));
