import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { BookOpen, FileText, Gauge, ScrollText, ShoppingBasket, Wallet as WalletIcon } from "lucide-react";
import { AppShell, SiteNav, TourProvider, matchesPath, useAppShell } from "@tollbooth-dpyc/web/react";
import type { ReactNode } from "react";
import Fieldscape from "./components/Fieldscape";
import { PublicPanel } from "./components/PanelPreview";
import { Sextant } from "./components/instruments/Instruments";
import { TOURS } from "./lib/tours";
import Catalog, { CatalogCollection } from "./views/Catalog";
import Home from "./views/Home";
import How from "./views/How";
import Log from "./views/Log";
import Panel from "./views/Panel";
import Prices from "./views/Prices";
import Profile from "./views/Profile";
import Sources from "./views/Sources";
import Terms from "./views/Terms";
import Wallet from "./views/Wallet";

const WELCOME = "Your own weather station and soil probes, read as one panel of instruments.";

const PAGES = [
  { href: "/panel", label: "Panel", icon: <Gauge size={18} aria-hidden /> },
  { href: "/log", label: "Log", icon: <ScrollText size={18} aria-hidden /> },
  { href: "/wallet", label: "Wallet", icon: <WalletIcon size={18} aria-hidden /> },
  { href: "/catalog", label: "Catalog", icon: <ShoppingBasket size={18} aria-hidden /> },
  { href: "/sources", label: "Sources", icon: <BookOpen size={18} aria-hidden /> },
  { href: "/terms", label: "Terms", icon: <FileText size={18} aria-hidden /> },
];

const OPEN_PAGES = [
  { to: "/panel", label: "Panel" },
  { to: "/how", label: "How it works" },
  { to: "/prices", label: "Prices" },
  { to: "/catalog", label: "Catalog" },
  { to: "/sources", label: "Sources" },
  { to: "/terms", label: "Terms" },
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
      <header className="site-bar flex flex-wrap items-center gap-2 px-4 py-2.5">
        <Brand />
        <nav className="ml-auto flex flex-wrap items-center gap-1 text-sm">
          {OPEN_PAGES.map((p) => (
            <Link key={p.to} to={p.to} className={matchesPath(pathname, p.to) ? "chip chip-on" : "chip"}>{p.label}</Link>
          ))}
          <Link to="/signin" className="chip chip-accent">Sign in</Link>
        </nav>
      </header>
    );
  }
  return (
    <header className="site-bar px-4 py-2">
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
          ],
          onSignOut: session.signOut,
        }}
        classNames={{ root: "flex flex-wrap items-center gap-2", list: "flex flex-wrap gap-1", item: "chip", active: "chip chip-on", end: "ml-auto flex items-center gap-3" }}
      />
    </header>
  );
}

function Footer() {
  const { status } = useAppShell();
  return (
    <footer className="site-bar space-y-1 px-4 py-4 text-center text-xs text-[var(--tb-muted)]">
      <nav className="flex flex-wrap justify-center gap-x-4 text-sm text-[var(--tb-ink)]">
        {OPEN_PAGES.map((p) => <Link key={p.to} to={p.to} className="underline">{p.label}</Link>)}
      </nav>
      <div>
        FieldData v{__APP_VERSION__} · {__BUILD_COMMIT__}
        {status?.version && ` · MCP ${status.version}`}
        {status?.tollbooth_dpyc_version && ` · SDK ${status.tollbooth_dpyc_version}`}
      </div>
      <div>
        Monetized with{" "}
        <a href="https://tollbooth-dpyc.com" target="_blank" rel="noopener noreferrer" className="underline">Tollbooth DPYC™</a>
        {" · "}Apache-2.0 · Patent Pending (US Prov. 64/045,999)
      </div>
      <div>Ecowitt and Ambient Weather are trademarks of their owners; no affiliation or endorsement is implied. Weather Icons by Erik Flowers, under the SIL OFL 1.1.</div>
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
        <Fieldscape />
        <Nav />
        <main className="flex-1">
          <Routes>
            <Route index element={<Home />} />
            <Route path="how" element={<How />} />
            <Route path="prices" element={<Prices />} />
            <Route path="catalog" element={<Catalog />} />
            <Route path="catalog/:handle" element={<CatalogCollection />} />
            <Route path="sources" element={<Sources />} />
            <Route path="terms" element={<Terms />} />
            <Route path="signin" element={session.signedIn ? <Navigate to="/panel" replace /> : <div className="page"><div className="card mx-auto max-w-3xl p-6">{gate}</div></div>} />
            <Route path="panel" element={session.signedIn ? <Panel /> : <PublicPanel />} />
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
