/** The account page: the package's folding groups, with your profile, units and language (You), your balance (Money), and the station keys and nearby stations (This site). */

import { AccountPage, BalanceAndTopUp, LanguageChooser, NostrProfilePanel, useAppShell, useTour } from "@tollbooth-dpyc/web/react";
import NearbyStations from "../components/NearbyStations";
import { useT } from "../i18n";
import StationKeys from "../components/StationKeys";
import { decorateTile } from "../lib/tiles";
import { useUnits } from "../lib/useUnits";
import type { UnitSystem } from "../lib/units";

const SYSTEMS = [
  { id: "si", label: "views.profile.metric" },
  { id: "us", label: "views.profile.us" },
] as const satisfies readonly { id: UnitSystem; label: string }[];

const USAGE = {
  root: "card p-5",
  header: "flex flex-wrap items-center justify-between gap-2",
  heading: "font-display text-lg",
  chip: "chip",
  figures: "mt-3 flex flex-wrap gap-x-8 gap-y-2",
  value: "block font-mono text-2xl text-[var(--tb-accent)]",
  label: "text-xs text-[var(--tb-muted)]",
  subheading: "font-display mt-4 mb-1",
  list: "divide-y divide-[var(--tb-line)] text-sm",
  row: "flex flex-wrap justify-between gap-x-4 py-2",
};

const BUILD = {
  root: "card build-card p-5 lg:col-span-2",
  heading: "font-display mb-2 text-lg",
  intro: "prose-line text-sm",
  section: "build-section",
  row: "flex flex-wrap gap-x-2 py-0.5 text-sm",
  label: "text-[var(--tb-muted)]",
  value: "font-mono text-xs leading-5",
  link: "underline",
};

function Units() {
  const t = useT();
  const [units, setUnits] = useUnits();
  return (
    <section data-tour="profile.units" className="card p-5">
      <h2 className="text-lg">{t("views.profile.units")}</h2>
      <p className="prose-line mb-3 text-sm">{t("views.profile.unitsIntro")}</p>
      <div className="flex gap-2">
        {SYSTEMS.map((s) => (
          <button key={s.id} type="button" onClick={() => setUnits(s.id)} aria-pressed={units === s.id} className={units === s.id ? "chip chip-on" : "chip"}>
            {t(s.label)}
          </button>
        ))}
      </div>
    </section>
  );
}

/** The reader's language, beside the units and drawn like them. */
function Language() {
  const t = useT();
  return (
    <section className="card p-5">
      <h2 className="mb-3 text-lg">{t("views.profile.language")}</h2>
      <LanguageChooser classNames={{ root: "flex flex-wrap gap-2", chip: "chip", active: "chip-on" }} />
    </section>
  );
}

export default function Profile() {
  useTour("account");
  const { session, status } = useAppShell();
  return (
    <div className="page">
      <AccountPage
        npub={session.npub}
        heading={null}
        profile={false}
        panels={{
          you: <><NostrProfilePanel npub={session.npub} /><Units /><Language /></>,
          money: <BalanceAndTopUp decorateTile={decorateTile} />,
          site: <><StationKeys npub={session.npub} /><NearbyStations /></>,
        }}
        theme={{ classNames: { chip: "chip", active: "chip chip-on" } }}
        timezone={{ classNames: { select: "field" } }}
        usage={{ classNames: USAGE }}
        build={{
          classNames: BUILD,
          status,
          frontend: { version: __APP_VERSION__, commit: __BUILD_COMMIT__, builtAt: __BUILD_TIME__, source: "https://github.com/lonniev/fielddata-mcp" },
        }}
        onSignOut={session.signOut}
        classNames={{
          root: "account",
          group: "account-group",
          groupSummary: "account-group-title",
          groupBody: "account-grid",
          section: "card p-5",
          sectionHeading: "font-display mb-1 text-lg",
          sectionIntro: "prose-line mb-3 text-sm",
          sectionNote: "prose-line mt-2 text-sm",
          actions: "card flex flex-wrap gap-2 p-5 lg:col-span-2",
          signOut: "chip",
        }}
      />
    </div>
  );
}
