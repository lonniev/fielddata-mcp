import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Gauge, ScrollText, Wallet as WalletIcon } from "lucide-react";
import { AppShell, SiteNav, TourProvider, matchesPath, useAppShell } from "@tollbooth-dpyc/web/react";
import type { ReactNode } from "react";
import { Sextant } from "./components/instruments/Instruments";
import { TOURS } from "./lib/tours";
import Home from "./views/Home";
import How from "./views/How";
import Log from "./views/Log";
import Panel from "./views/Panel";
import Prices from "./views/Prices";
import Profile from "./views/Profile";
import Terms from "./views/Terms";
import Wallet from "./views/Wallet";

const WELCOME = "Your own weather station and soil probes, read as one panel of instruments.";

const PAGES = [
  { href: "/panel", label: "Panel", icon: <Gauge size={18} aria-hidden /> },
  { href: "/log", label: "Log", icon: <ScrollText size={18} aria-hidden /> },
  { href: "/wallet", label: "Wallet", icon: <WalletIcon size={18} aria-hidden /> },
];

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg">
      <Sextant />
      FieldData
    </Link>
  );
}

function Nav() {
  const { session } = useAppShell();
  const { pathname } = useLocation();
  if (!session.signedIn) {
    return (
      <header className="flex items-center gap-2 border-b border-[var(--tb-line)] px-4 py-2.5">
        <Brand />
        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link to="/how" className="px-2 py-2">How it works</Link>
          <Link to="/prices" className="px-2 py-2">Prices</Link>
          <Link to="/signin" className="chip chip-accent">Sign in</Link>
        </nav>
      </header>
    );
  }
  return (
    <header className="border-b border-[var(--tb-line)] px-4 py-2">
      <SiteNav
        brand={<Brand />}
        items={PAGES}
        isActive={(href) => matchesPath(pathname, href)}
        renderLink={({ href, ...p }) => <Link to={href} {...p} />}
        account={{
          npub: session.npub,
          links: [
            { href: "/profile", label: "Profile & theme" },
            { href: "/prices", label: "Prices" },
            { href: "/how", label: "How it works" },
            { href: "/terms", label: "Terms" },
          ],
          onSignOut: session.signOut,
        }}
        classNames={{ root: "flex items-center gap-2", list: "flex gap-1", item: "chip", active: "chip chip-on", end: "ml-auto flex items-center gap-3" }}
      />
    </header>
  );
}

function Footer() {
  const { status } = useAppShell();
  return (
    <footer className="border-t border-[var(--tb-line)] px-4 py-4 text-center text-xs text-[var(--tb-muted)]">
      <div>
        FieldData v{__APP_VERSION__} · {__BUILD_COMMIT__}
        {status?.version && ` · MCP ${status.version}`}
        {status?.tollbooth_dpyc_version && ` · SDK ${status.tollbooth_dpyc_version}`}
        {" · "}<Link to="/terms" className="underline">Terms</Link>
      </div>
      <div>
        Monetized with{" "}
        <a href="https://tollbooth-dpyc.com" target="_blank" rel="noopener noreferrer" className="underline">Tollbooth DPYC™</a>
        {" · "}Apache-2.0 · Patent Pending (US Prov. 64/045,999)
      </div>
      <div>Ecowitt is a trademark of its owner; no affiliation or endorsement is implied. Weather Icons by Erik Flowers, under the SIL OFL 1.1.</div>
    </footer>
  );
}

/** A page that reads an account sends a stranger to sign in first. */
function Session({ children }: { children: ReactNode }) {
  const { session } = useAppShell();
  return session.signedIn ? children : <Navigate to="/signin" replace />;
}

function Site() {
  const { session, gate } = useAppShell();
  return (
    <BrowserRouter>
      <TourProvider tours={TOURS}>
        <Nav />
        <main className="flex-1">
          <Routes>
            <Route index element={<Home />} />
            <Route path="how" element={<How />} />
            <Route path="prices" element={<Prices />} />
            <Route path="terms" element={<Terms />} />
            <Route path="signin" element={session.signedIn ? <Navigate to="/panel" replace /> : <div className="py-8">{gate}</div>} />
            <Route path="panel" element={<Session><Panel /></Session>} />
            <Route path="log" element={<Session><Log /></Session>} />
            <Route path="wallet" element={<Session><Wallet /></Session>} />
            <Route path="profile" element={<Session><Profile /></Session>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </TourProvider>
    </BrowserRouter>
  );
}

// The session, the gate, the theme, the status and the debug log are the
// package's AppShell; FieldData brings its routes, its instruments and its words.
export default function App() {
  return (
    <AppShell theme="dark" gateOptions={{ welcome: WELCOME }} signedOut={() => <Site />}>
      {() => <Site />}
    </AppShell>
  );
}
