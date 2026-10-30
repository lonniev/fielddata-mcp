/** The readings laid out as a panel of instruments, in the panel's reading order. */

import { PANEL_ORDER, instrumentLabel, type SensorKind } from "../../lib/instruments";
import type { Reading } from "../../lib/field";
import type { UnitSystem } from "../../lib/units";
import { Gauge } from "./Instruments";

export function sortForPanel<T extends Pick<Reading, "sensor_kind" | "channel">>(readings: readonly T[]): T[] {
  const rank = (kind: string) => {
    const i = PANEL_ORDER.indexOf(kind as SensorKind);
    return i < 0 ? PANEL_ORDER.length : i;
  };
  return [...readings].sort((a, b) => rank(a.sensor_kind) - rank(b.sensor_kind) || (a.channel ?? 0) - (b.channel ?? 0));
}

export default function Deck({
  readings,
  units,
  onOpen,
  wide = false,
}: {
  readings: readonly Reading[];
  units: UnitSystem;
  onOpen?: (reading: Reading) => void;
  /** A whole page's width: more instruments to the row, so each stays dial-sized. */
  wide?: boolean;
}) {
  return (
    <div className={wide ? "deck deck-wide" : "deck"}>
      {sortForPanel(readings).map((r) => {
        const label = instrumentLabel(r.sensor_kind, r.channel, r.channel_name);
        const gauge = <Gauge kind={r.sensor_kind} quantity={r.quantity} unit={r.unit} units={units} label={label} />;
        return onOpen ? (
          <button key={`${r.sensor_kind}|${r.channel}`} type="button" onClick={() => onOpen(r)} aria-label={`${label} trace`} className="rounded-full">
            {gauge}
          </button>
        ) : (
          <div key={`${r.sensor_kind}|${r.channel}`}>{gauge}</div>
        );
      })}
    </div>
  );
}
