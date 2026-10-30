/**
 * The panel with no station behind it, for look reviews before the hardware
 * arrives: real components on the vendor's sample payload, run through the
 * service's own parser (readings.json), plus a synthetic trace.
 */
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { configureTollbooth } from "@tollbooth-dpyc/web";
import { SiteNav, ThemeToggle, TourProvider } from "@tollbooth-dpyc/web/react";
import { NAV_CLASSES } from "../src/App";
import Fieldscape from "../src/components/Fieldscape";
import ProfileView from "../src/views/Profile";
import WalletView from "../src/views/Wallet";
import { AppShell } from "@tollbooth-dpyc/web/react";
import Deck from "../src/components/instruments/Deck";
import Trace from "../src/components/Trace";
import { Gauge, Sextant } from "../src/components/instruments/Instruments";
import type { Reading, Series } from "../src/lib/field";
import type { UnitSystem } from "../src/lib/units";
import { SAMPLE } from "../src/views/Home";
import "../src/index.css";
import readings from "./readings.json";

configureTollbooth({ slug: "fielddata", appName: "FieldData", mcpUrl: "/mcp" });

const series: Series = {
  sensor_kind: "pressure", channel: null, channel_name: null, unit: "hPa",
  points: Array.from({ length: 96 }, (_, i) => [
    new Date(Date.UTC(2026, 0, 1, 0, i * 15)).toISOString(),
    1012 + 6 * Math.sin(i / 14) + Math.sin(i / 2.3) * 0.5,
  ]),
};

function Harness() {
  const [units, setUnits] = useState<UnitSystem>("si");
  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4">
      <header className="flex flex-wrap items-center gap-2">
        <Sextant size={32} /><h1 className="text-2xl">Instrument harness</h1>
        <button className={units === "si" ? "chip chip-on" : "chip"} onClick={() => setUnits("si")}>Metric</button>
        <button className={units === "us" ? "chip chip-on" : "chip"} onClick={() => setUnits("us")}>US</button>
        <ThemeToggle themes={["dark", "light"]} classNames={{ chip: "chip", active: "chip chip-on" }} />
      </header>
      <Deck readings={readings as Reading[]} units={units} onOpen={() => undefined} />
      <section className="card p-4"><h2 className="mb-2 text-lg">Barometer: the last day</h2><Trace series={series} units={units} label="pressure" /></section>
      <h2 className="text-lg">At rest, and an unknown sensor</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Gauge kind="pressure" quantity={null} unit="hPa" units={units} label="Barometer" />
        <Gauge kind="wind_direction" quantity={null} unit="deg" units={units} label="Wind vane" />
        <Gauge kind="air_temperature" quantity={null} unit="°C" units={units} label="Air" />
        <Gauge kind="sap_flow" quantity={4.2} unit="g/h" units={units} label="Sap flow" />
      </div>
    </div>
  );
}

/** The share card, captured at 1200×630 into public/og-image.png: illustrative figures only. */
function ShareCard() {
  return (
    <div className="flex h-[630px] flex-col justify-center gap-8 px-14">
      <h1 className="flex items-center gap-4 text-5xl"><Sextant size={56} />What your own ground actually measured.</h1>
      <Deck readings={SAMPLE} units="si" />
    </div>
  );
}

/** The wallet with no session: the coupons draw, and the balance says it could not be read. */
const WalletReview = () => <TourProvider tours={{}}><Fieldscape /><WalletView /></TourProvider>;

/** The account page laid out with no real session behind it. */
const ProfileReview = () => (
  <AppShell theme="dark" signedOut={() => <TourProvider tours={{}}><Fieldscape /><ProfileView /></TourProvider>}>
    {() => null}
  </AppShell>
);

/** The bar with its account menu open over a page, so a look at the menu needs no session. */
function NavReview() {
  useEffect(() => { document.querySelector<HTMLButtonElement>('button[aria-label="Account"]')?.click(); }, []);
  return (
    <>
      <Fieldscape />
      <header className="site-bar px-4 py-2">
        <SiteNav
          brand={<b>FieldData</b>}
          items={[{ href: "#a", label: "Panel" }, { href: "#b", label: "Log" }]}
          renderLink={({ href, ...p }) => <a href={href} {...p} />}
          account={{ npub: "npub1reviewreviewreviewreviewreviewreviewreviewreviewreviewreview", links: [{ href: "#p", label: "Profile & theme" }, { href: "#q", label: "Prices" }], onSignOut: () => undefined }}
          classNames={NAV_CLASSES}
        />
      </header>
      <div className="page"><div className="card p-5">The page under the menu.</div></div>
    </>
  );
}

const VIEWS: Record<string, () => React.JSX.Element> = { "?og": ShareCard, "?wallet": WalletReview, "?profile": ProfileReview, "?nav": NavReview };
if (location.hash === "#light") document.documentElement.dataset.theme = "light";
const View = VIEWS[location.search] ?? Harness;
createRoot(document.getElementById("root")!).render(<View />);
