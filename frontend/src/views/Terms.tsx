/** What the words mean, grouped, with a search. */

import { useState } from "react";
import { Link } from "react-router-dom";
import { GROUPS, searchGlossary } from "../lib/glossary";
import { useUnits } from "../lib/useUnits";

export default function Terms() {
  const [units] = useUnits();
  const [query, setQuery] = useState("");
  const hits = searchGlossary(query, units);
  return (
    <div className="page space-y-4">
      <header className="card flex flex-wrap items-center gap-3 p-5">
        <div className="min-w-0 flex-1 basis-72">
          <h1 className="text-3xl">Terms</h1>
          <p className="prose-line mt-1 text-sm">What the words on this site mean.</p>
        </div>
        <input className="field w-full sm:w-72" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the words" aria-label="Search the terms" />
      </header>
      {hits.length === 0 && <p className="card prose-line p-5 text-sm">No term matches that.</p>}
      {GROUPS.map((group) => {
        const entries = hits.filter((e) => e.group === group.id);
        if (!entries.length) return null;
        return (
          <section key={group.id} className="space-y-3">
            <h2 className="card px-5 py-3 text-lg">{group.title}</h2>
            <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
              {entries.map((e) => (
                <article key={e.key} className="card p-5">
                  <h3 className="font-display text-lg">{e.term}</h3>
                  {e.aka && <p className="text-xs text-[var(--tb-muted)]">{e.aka.join(" · ")}</p>}
                  <p className="prose-line mt-1 text-sm">{e.said(units)}</p>
                </article>
              ))}
            </div>
          </section>
        );
      })}
      <p className="card p-4 text-center text-sm"><Link to="/terms-of-use" className="underline">Terms of use</Link></p>
    </div>
  );
}
