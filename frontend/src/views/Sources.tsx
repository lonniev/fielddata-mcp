/** Where every figure comes from and what was done to it, so a grower can check any of it. */

import { CAFE_URL } from "../lib/cafe";

const CARDS: { title: string; says: string[]; link?: [string, string] }[] = [
  { title: "Your own station", says: [
    "Every reading comes from your own account on Ecowitt.net, through its version 3 API.",
    "All Ecowitt gateways upload there, the 4G WittField included.",
  ], link: ["Ecowitt API reference", "https://doc.ecowitt.net/web/#/apiv3en"] },
  { title: "Units and clocks", says: [
    "FieldData asks the vendor for SI units, then converts by the unit each value arrives with.",
    "Every reading is reported in UTC, and each day in the log is your station's own local day.",
  ] },
  { title: "Frost hours", says: [
    "Each sample at or below 0 °C counts for the time that sample stands for.",
    "The log reads half-hour samples, so each cold one adds half an hour.",
  ] },
  { title: "Degree-days", says: [
    "The log uses the daily mean method: the larger of zero and (low + high) ÷ 2 − base.",
    "You choose the base temperature when you read the log.",
  ] },
  { title: "Rain", says: [
    "A day's rain is the highest value of the station's running total that day.",
    "The vendor resets that total at local midnight.",
  ] },
  { title: "What is kept", says: [
    "Answers stay in a one-minute cache and readings are not stored.",
    "Your vendor keys are stored encrypted under your npub, and you may delete them at any time.",
  ] },
  { title: "Good Earth", says: [
    "Good Earth projects what a block of ground should do, and FieldData reports what it did.",
  ], link: ["Good Earth", "https://goodearth.tollbooth-dpyc.com"] },
  { title: "The wallet list", says: [
    "The wallets offered under Need a wallet come from the DPYC Oracle each time you open it.",
  ], link: ["DPYC community", "https://github.com/lonniev/dpyc-community"] },
  { title: "The Catalog", says: [
    "The Catalog reads the Good Brew café's public feed, and the café takes every order.",
  ], link: ["Good Brew café", CAFE_URL] },
  { title: "Instrument faces", says: [
    "The instrument icons are Weather Icons by Erik Flowers, under the SIL OFL 1.1.",
  ], link: ["Weather Icons", "https://erikflowers.github.io/weather-icons/"] },
  { title: "The code", says: [
    "FieldData and the Tollbooth DPYC™ runtime are open source under Apache-2.0.",
  ], link: ["FieldData source", "https://github.com/lonniev/fielddata-mcp"] },
];

const REACH: [string, string, string][] = [
  ["5 minutes", "1 day", "90 days"],
  ["30 minutes", "7 days", "1 year"],
  ["4 hours", "31 days", "2 years"],
  ["1 day", "1 year", "4 years"],
];

export default function Sources() {
  return (
    <div className="page space-y-4">
      <header className="card p-5">
        <h1 className="text-3xl">Sources</h1>
        <p className="prose-line mt-1 text-sm">Every figure on this site comes from a place you can check, by arithmetic you can repeat.</p>
      </header>
      <div className="columns-1 gap-4 md:columns-2 xl:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
        {CARDS.map((c) => (
          <section key={c.title} className="card p-5">
            <h2 className="text-lg">{c.title}</h2>
            {c.says.map((line) => <p key={line} className="prose-line mt-1 text-sm">{line}</p>)}
            {c.link && <a href={c.link[1]} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm underline">{c.link[0]}</a>}
          </section>
        ))}
        <section className="card p-5">
          <h2 className="text-lg">How far back the vendor reaches</h2>
          <table className="mt-2 w-full text-left text-sm">
            <thead className="text-[var(--tb-muted)]">
              <tr><th className="py-1 font-normal">Sample</th><th className="py-1 font-normal">Each request</th><th className="py-1 font-normal">Reach</th></tr>
            </thead>
            <tbody className="font-mono">
              {REACH.map(([sample, span, reach]) => (
                <tr key={sample} className="border-t border-[var(--tb-line)]"><td className="py-1">{sample}</td><td className="py-1">{span}</td><td className="py-1">{reach}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
