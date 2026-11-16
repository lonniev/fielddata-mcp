/** The tutorial: from a station on a post to a panel in the browser. */

import { Link } from "react-router-dom";
import { Tx } from "@tollbooth-dpyc/web/react";
import { WORDS, useT } from "../i18n";

const STEPS = [
  { title: "views.how.step.station.title", says: "views.how.step.station.says" },
  { title: "views.how.step.signIn.title", says: "views.how.step.signIn.says" },
  { title: "views.how.step.fund.title", says: "views.how.step.fund.says" },
  { title: "views.how.step.connect.title", says: "views.how.step.connect.says" },
  { title: "views.how.step.nearby.title", says: "views.how.step.nearby.says" },
  { title: "views.how.step.read.title", says: "views.how.step.read.says" },
  { title: "views.how.step.log.title", says: "views.how.step.log.says" },
] as const;

export default function How() {
  const t = useT();
  return (
    <div className="page space-y-4">
      <header className="card flex flex-wrap items-center gap-3 p-5">
        <h1 className="text-3xl">{t("views.how.title")}</h1>
        <Link to="/signin" className="chip chip-accent ml-auto">{t("views.how.signIn")}</Link>
      </header>
      <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="card flex gap-4 p-5">
            <span className="font-mono text-2xl text-[var(--tb-accent)]">{i + 1}</span>
            <div>
              <h2 className="text-lg">{t(s.title)}</h2>
              <p className="prose-line text-sm">{t(s.says)}</p>
            </div>
          </li>
        ))}
      </ol>
      <section className="card p-5">
        <h2 className="text-lg">{t("views.how.agentHeading")}</h2>
        <p className="prose-line mt-1 text-sm">
          <Tx ns={WORDS} k="views.how.agent" components={{ url: <code className="font-mono">https://fielddata-mcp.fastmcp.app/mcp</code> }} />
        </p>
      </section>
    </div>
  );
}
