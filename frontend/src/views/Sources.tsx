/** Where every figure comes from and what was done to it, so a grower can check any of it. */

import { useT, type Translate } from "../i18n";
import { CAFE_URL } from "../lib/cafe";
import { formatWhole, type UnitSystem } from "../lib/units";
import { useUnits } from "../lib/useUnits";

const cards = (t: Translate, units: UnitSystem): { title: string; says: string[]; link?: [string, string] }[] => [
  { title: t("views.sources.ecowitt.title"), says: [
    t("views.sources.ecowitt.says1"),
    t("views.sources.ecowitt.says2"),
  ], link: [t("views.sources.ecowitt.link"), "https://doc.ecowitt.net/web/#/apiv3en"] },
  { title: t("views.sources.ambient.title"), says: [
    t("views.sources.ambient.says1"),
    t("views.sources.ambient.says2"),
    t("views.sources.ambient.says3"),
  ], link: [t("views.sources.ambient.link"), "https://github.com/ambient-weather/api-docs"] },
  { title: t("views.sources.units.title"), says: [
    t("views.sources.units.says1"),
    t("views.sources.units.says2"),
  ] },
  { title: t("views.sources.nearby.title"), says: [
    t("views.sources.nearby.says1"),
    t("views.sources.nearby.says2"),
    t("views.sources.nearby.says3"),
  ] },
  { title: t("views.sources.frost.title"), says: [
    t("views.sources.frost.says1", { freezing: formatWhole(0, "°C", units) }),
    t("views.sources.frost.says2"),
  ] },
  { title: t("views.sources.degreeDays.title"), says: [
    t("views.sources.degreeDays.says1"),
    t("views.sources.degreeDays.says2"),
  ] },
  { title: t("views.sources.rain.title"), says: [
    t("views.sources.rain.says1"),
    t("views.sources.rain.says2"),
  ] },
  { title: t("views.sources.kept.title"), says: [
    t("views.sources.kept.says1"),
    t("views.sources.kept.says2"),
  ] },
  { title: "Good Earth", says: [
    t("views.sources.goodEarth.says1"),
  ], link: ["Good Earth", "https://goodearth.tollbooth-dpyc.com"] },
  { title: t("views.sources.wallets.title"), says: [
    t("views.sources.wallets.says1"),
  ], link: [t("views.sources.wallets.link"), "https://github.com/lonniev/dpyc-community"] },
  { title: t("views.sources.catalog.title"), says: [
    t("views.sources.catalog.says1"),
  ], link: ["Good Brew café", CAFE_URL] },
  { title: t("views.sources.icons.title"), says: [
    t("views.sources.icons.says1"),
  ], link: ["Weather Icons", "https://erikflowers.github.io/weather-icons/"] },
  { title: t("views.sources.code.title"), says: [
    t("views.sources.code.says1"),
  ], link: [t("views.sources.code.link"), "https://github.com/lonniev/fielddata-mcp"] },
];

/** A span of time: how many, and of what. */
type Span = [number, "minute" | "hour" | "day" | "year"];

const AMBIENT_REACH: [Span, Span, Span][] = [
  [[5, "minute"], [7, "day"], [1, "year"]],
  [[30, "minute"], [31, "day"], [1, "year"]],
];

const REACH: [Span, Span, Span][] = [
  [[5, "minute"], [1, "day"], [90, "day"]],
  [[30, "minute"], [7, "day"], [1, "year"]],
  [[4, "hour"], [31, "day"], [2, "year"]],
  [[1, "day"], [1, "year"], [4, "year"]],
];

/** "5 minutes", "1 year": the catalog holds each unit's _one and _other forms. */
const spanText = (t: Translate, [count, unit]: Span) => t(`views.sources.${unit}` as Parameters<Translate>[0], { count });

export default function Sources() {
  const t = useT();
  const [units] = useUnits();
  return (
    <div className="page space-y-4">
      <header className="card p-5">
        <h1 className="text-3xl">{t("views.sources.title")}</h1>
        <p className="prose-line mt-1 text-sm">{t("views.sources.intro")}</p>
      </header>
      <div className="columns-1 gap-4 md:columns-2 xl:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
        {cards(t, units).map((c) => (
          <section key={c.title} className="card p-5">
            <h2 className="text-lg">{c.title}</h2>
            {c.says.map((line) => <p key={line} className="prose-line mt-1 text-sm">{line}</p>)}
            {c.link && <a href={c.link[1]} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm underline">{c.link[0]}</a>}
          </section>
        ))}
        <section className="card p-5">
          <h2 className="text-lg">{t("views.sources.ecowittReach")}</h2>
          <table className="mt-2 w-full text-left text-sm">
            <thead className="text-[var(--tb-muted)]">
              <tr><th className="py-1 font-normal">{t("views.sources.sample")}</th><th className="py-1 font-normal">{t("views.sources.eachRequest")}</th><th className="py-1 font-normal">{t("views.sources.reach")}</th></tr>
            </thead>
            <tbody className="font-mono">
              {REACH.map((row) => (
                <tr key={row[0].join()} className="border-t border-[var(--tb-line)]">{row.map((span, i) => <td key={i} className="py-1">{spanText(t, span)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card p-5">
          <h2 className="text-lg">{t("views.sources.ambientReach")}</h2>
          <table className="mt-2 w-full text-left text-sm">
            <thead className="text-[var(--tb-muted)]">
              <tr><th className="py-1 font-normal">{t("views.sources.sample")}</th><th className="py-1 font-normal">{t("views.sources.eachCall")}</th><th className="py-1 font-normal">{t("views.sources.reach")}</th></tr>
            </thead>
            <tbody className="font-mono">
              {AMBIENT_REACH.map((row) => (
                <tr key={row[0].join()} className="border-t border-[var(--tb-line)]">{row.map((span, i) => <td key={i} className="py-1">{spanText(t, span)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
