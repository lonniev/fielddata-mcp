/** The account page: the package's panels in their one order, with the station keys and display units. */

import { AccountPage, useAppShell, useTour } from "@tollbooth-dpyc/web/react";
import StationKeys from "../components/StationKeys";
import { useUnits } from "../lib/useUnits";
import type { UnitSystem } from "../lib/units";

const SYSTEMS: { id: UnitSystem; label: string }[] = [
  { id: "si", label: "Metric" },
  { id: "us", label: "US" },
];

function Units() {
  const [units, setUnits] = useUnits();
  return (
    <section data-tour="profile.units" className="card p-5">
      <h2 className="text-lg">Units</h2>
      <p className="prose-line mb-3 text-sm">The scales and figures on every instrument, on this device.</p>
      <div className="flex gap-2">
        {SYSTEMS.map((s) => (
          <button key={s.id} type="button" onClick={() => setUnits(s.id)} aria-pressed={units === s.id} className={units === s.id ? "chip chip-on" : "chip"}>
            {s.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export default function Profile() {
  useTour("account");
  const { session, status } = useAppShell();
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <AccountPage
        npub={session.npub}
        before={<StationKeys npub={session.npub} />}
        between={{ timezone: <Units /> }}
        theme={{ classNames: { chip: "chip", active: "chip chip-on" } }}
        timezone={{ classNames: { select: "field" } }}
        coupons={false}
        build={{
          status,
          frontend: { version: __APP_VERSION__, commit: __BUILD_COMMIT__, builtAt: __BUILD_TIME__, source: "https://github.com/lonniev/fielddata-mcp" },
        }}
        onSignOut={session.signOut}
        classNames={{ root: "space-y-5", section: "card p-5", signOut: "chip" }}
      />
    </div>
  );
}
