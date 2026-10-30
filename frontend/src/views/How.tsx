/** The tutorial: from a station on a post to a panel in the browser. */

import { Link } from "react-router-dom";

const STEPS: { title: string; says: string }[] = [
  { title: "Put up your station", says: "Any Ecowitt gateway that reports to ecowitt.net will do, including the 4G WittField." },
  { title: "Sign in with Nostr", says: "Use an npub you already hold, or make a new key on the sign-in page." },
  { title: "Fund your balance", says: "Pay a Lightning invoice from your wallet, and your tool fees draw on those sats." },
  { title: "Connect your station", says: "Make an Application Key and an API Key at ecowitt.net, then send them by the Nostr message FieldData sends you." },
  { title: "Read your instruments", says: "Open the panel for the latest readings, and tap any instrument for its last day." },
  { title: "Keep the log", says: "The log gives each day's temperature, frost hours, rain and degree-days." },
];

export default function How() {
  return (
    <div className="page space-y-4">
      <header className="card flex flex-wrap items-center gap-3 p-5">
        <h1 className="text-3xl">How it works</h1>
        <Link to="/signin" className="chip chip-accent ml-auto">Sign in</Link>
      </header>
      <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="card flex gap-4 p-5">
            <span className="font-mono text-2xl text-[var(--tb-accent)]">{i + 1}</span>
            <div>
              <h2 className="text-lg">{s.title}</h2>
              <p className="prose-line text-sm">{s.says}</p>
            </div>
          </li>
        ))}
      </ol>
      <section className="card p-5">
        <h2 className="text-lg">For your AI agent</h2>
        <p className="prose-line mt-1 text-sm">
          Add <code className="font-mono">https://fielddata-mcp.fastmcp.app/mcp</code> as a remote MCP server, and your agent reads the same stations under the same balance.
        </p>
      </section>
    </div>
  );
}
