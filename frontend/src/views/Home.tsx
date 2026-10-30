/** The front door: what FieldData is, on instruments that show it. */

import { Link } from "react-router-dom";
import { useAppShell } from "@tollbooth-dpyc/web/react";
import Deck from "../components/instruments/Deck";
import type { Reading } from "../lib/field";

// Illustrative figures for the page itself: no station stands behind them.
export const SAMPLE: Reading[] = (
  [
    ["air_temperature", 18.4, "°C"],
    ["wind_direction", 292, "deg"],
    ["pressure", 1016.5, "hPa"],
    ["rain_total", 22.5, "mm"],
  ] as const
).map(([sensor_kind, quantity, unit]) => ({
  station_id: "sample",
  vendor: "sample",
  sensor_kind,
  channel: null,
  channel_name: null,
  quantity,
  unit,
  observed_at: "2026-01-01T00:00:00Z",
}));

const WHY: { title: string; says: string }[] = [
  { title: "Your own station", says: "Your station stays on your own vendor account, and FieldData reads it under your own keys." },
  { title: "One shape of reading", says: "Every reading arrives in SI units and UTC, whichever station made it." },
  { title: "Nothing kept", says: "Readings pass through to you: FieldData keeps a one-minute cache and no record of your ground." },
  { title: "Beside the forecast", says: "Good Earth projects what a block of ground should do, and FieldData reports what it did." },
];

export default function Home() {
  const { session } = useAppShell();
  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="py-10 text-center sm:py-14">
        <h1 className="text-4xl leading-tight sm:text-5xl">What your own ground actually measured.</h1>
        <p className="prose-line mx-auto mt-4 max-w-xl">
          FieldData reads your weather station and soil probes as one panel of instruments, for you and for your AI agents.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to={session.signedIn ? "/panel" : "/signin"} className="chip chip-accent">
            {session.signedIn ? "Open the panel" : "Sign in"}
          </Link>
          <Link to="/how" className="chip">How it works</Link>
        </div>
      </section>

      <figure className="mx-auto max-w-3xl">
        <Deck readings={SAMPLE} units="si" />
        <figcaption className="mt-2 text-center text-xs text-[var(--tb-muted)]">Illustrative readings.</figcaption>
      </figure>

      <section className="grid gap-3 py-10 sm:grid-cols-2">
        {WHY.map((w) => (
          <div key={w.title} className="card p-5">
            <h2 className="text-lg">{w.title}</h2>
            <p className="prose-line mt-1 text-sm">{w.says}</p>
          </div>
        ))}
      </section>

      <section className="card mb-10 p-6">
        <h2 className="text-xl">Built on Tollbooth DPYC™</h2>
        <p className="prose-line mt-2 text-sm">
          DPYC™ stands for Don't Pester Your Customer™: you pre-fund a balance in Bitcoin Lightning and each reading draws on it, with no subscription or payment popup.
        </p>
        <p className="prose-line mt-2 text-sm">
          Your identity is a Nostr key, so FieldData asks for no email address and no password.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/prices" className="chip">Prices</Link>
          <a href="https://tollbooth-dpyc.com" target="_blank" rel="noopener noreferrer" className="chip">Tollbooth DPYC™</a>
        </div>
      </section>
    </div>
  );
}
