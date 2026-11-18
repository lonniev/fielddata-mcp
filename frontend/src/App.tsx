import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { BookOpen, FileText, Gauge, ScrollText, ShoppingBasket, Wallet as WalletIcon } from "lucide-react";
import { AppShell, SiteNav, TourProvider, Tx, matchesPath, useAppShell } from "@tollbooth-dpyc/web/react";
import { lazy, Suspense, useMemo, type ReactNode } from "react";
import { PublicPanel } from "./components/PanelPreview";
import Waiting from "./components/Waiting";
import { Sextant } from "./components/instruments/Instruments";
import { WORDS, useT } from "./i18n";
import { tours } from "./lib/tours";
import Home from "./views/Home";

// Each page past the front door is its own chunk, fetched the first time it opens.
const Catalog = lazy(() => import("./views/Catalog"));
const CatalogCollection = lazy(() => import("./views/Catalog").then((m) => ({ default: m.CatalogCollection })));
const How = lazy(() => import("./views/How"));
const Log = lazy(() => import("./views/Log"));
const Panel = lazy(() => import("./views/Panel"));
const Prices = lazy(() => import("./views/Prices"));
const Profile = lazy(() => import("./views/Profile"));
const Sources = lazy(() => import("./views/Sources"));
const Terms = lazy(() => import("./views/Terms"));
const TermsOfUse = lazy(() => import("./views/TermsOfUse"));
const Wallet = lazy(() => import("./views/Wallet"));

const PAGES = [
  { href: "/panel", label: "ui.app.nav.panel", icon: <Gauge size={18} aria-hidden /> },
  { href: "/log", label: "ui.app.nav.log", icon: <ScrollText size={18} aria-hidden /> },
  { href: "/wallet", label: "ui.app.nav.wallet", icon: <WalletIcon size={18} aria-hidden /> },
  { href: "/catalog", label: "ui.app.nav.catalog", icon: <ShoppingBasket size={18} aria-hidden /> },
  { href: "/sources", label: "ui.app.nav.sources", icon: <BookOpen size={18} aria-hidden /> },
  { href: "/terms", label: "ui.app.nav.terms", icon: <FileText size={18} aria-hidden /> },
] as const;

export const NAV_CLASSES = {
  root: "flex flex-wrap items-center gap-2",
  nav: "relative",
  list: "flex flex-wrap gap-1",
  item: "chip",
  active: "chip chip-on",
  toggle: "chip",
  menu: "site-menu left-0",
  menuItem: "site-menu-item",
  menuItemActive: "site-menu-item text-[var(--tb-accent)]",
  end: "ml-auto flex items-center gap-3",
  account: "relative",
  accountButton: "rounded-full",
  accountMenu: "site-menu right-0",
  accountHeader: "border-b border-[var(--tb-line)] px-3 pb-2 mb-1",
  accountHeading: "text-xs text-[var(--tb-muted)]",
  accountNpub: "break-all font-mono text-xs",
  accountLink: "site-menu-item",
  signOut: "site-menu-item w-full text-left",
};

const OPEN_PAGES = [
  { to: "/panel", label: "ui.app.nav.panel" },
  { to: "/how", label: "ui.app.nav.how" },
  { to: "/prices", label: "ui.app.nav.prices" },
  { to: "/catalog", label: "ui.app.nav.catalog" },
  { to: "/sources", label: "ui.app.nav.sources" },
  { to: "/terms", label: "ui.app.nav.terms" },
] as const;

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg">
      <Sextant />
      FieldData
    </Link>
  );
}

function Nav() {
  const t = useT();
  const { session } = useAppShell();
  const { pathname } = useLocation();
  if (!session.signedIn) {
    return (
      <header className="site-bar flex flex-wrap items-center gap-2 px-4 py-2.5">
        <Brand />
        <nav className="ml-auto flex flex-wrap items-center gap-1 text-sm">
          {OPEN_PAGES.map((p) => (
            <Link key={p.to} to={p.to} className={matchesPath(pathname, p.to) ? "chip chip-on" : "chip"}>{t(p.label)}</Link>
          ))}
          <Link to="/signin" className="chip chip-accent">{t("ui.app.signIn")}</Link>
        </nav>
      </header>
    );
  }
  return (
    <header className="site-bar px-4 py-2">
      <SiteNav
        brand={<Brand />}
        items={PAGES.map((p) => ({ ...p, label: t(p.label) }))}
        isActive={(href) => matchesPath(pathname, href)}
        renderLink={({ href, ...p }) => <Link to={href} {...p} />}
        account={{
          npub: session.npub,
          links: [
            { href: "/profile", label: t("ui.app.nav.profile") },
            { href: "/prices", label: t("ui.app.nav.prices") },
            { href: "/how", label: t("ui.app.nav.how") },
          ],
          onSignOut: session.signOut,
        }}
        classNames={NAV_CLASSES}
      />
    </header>
  );
}

function Footer() {
  const t = useT();
  const { status } = useAppShell();
  return (
    <footer className="site-bar space-y-1 px-4 py-4 text-center text-xs text-[var(--tb-muted)]">
      <nav className="flex flex-wrap justify-center gap-x-4 text-sm text-[var(--tb-ink)]">
        {OPEN_PAGES.map((p) => <Link key={p.to} to={p.to} className="underline">{t(p.label)}</Link>)}
        <Link to="/terms-of-use" className="underline">{t("ui.app.nav.termsOfUse")}</Link>
      </nav>
      <div>
        FieldData v{__APP_VERSION__} · {__BUILD_COMMIT__}
        {status?.version && ` · MCP ${status.version}`}
        {status?.tollbooth_dpyc_version && ` · SDK ${status.tollbooth_dpyc_version}`}
      </div>
      <div>
        <Tx ns={WORDS} k="ui.app.monetized" components={{ tb: <a href="https://tollbooth-dpyc.com" target="_blank" rel="noopener noreferrer" className="underline">Tollbooth DPYC™</a> }} />
      </div>
      <div>{t("ui.app.trademarks")}</div>
    </footer>
  );
}

/** A page that reads an account sends a stranger to sign in first. */
function Session({ children }: { children: ReactNode }) {
  const { session } = useAppShell();
  return session.signedIn ? children : <Navigate to="/signin" replace />;
}

function Site() {
  const t = useT();
  const { session, gate } = useAppShell();
  const shown = useMemo(() => tours(t), [t]);
  return (
    <BrowserRouter>
      <TourProvider tours={shown}>
        <div aria-hidden="true" className="backdrop" />
        <Nav />
        <main className="flex-1">
          <Suspense fallback={<Waiting heading={t("ui.app.opening")} />}>
            <Routes>
              <Route index element={<Home />} />
              <Route path="how" element={<How />} />
              <Route path="prices" element={<Prices />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="catalog/:handle" element={<CatalogCollection />} />
              <Route path="sources" element={<Sources />} />
              <Route path="terms" element={<Terms />} />
              <Route path="terms-of-use" element={<TermsOfUse />} />
              <Route path="signin" element={session.signedIn ? <Navigate to="/panel" replace /> : <div className="page"><div className="card p-6">{gate}</div></div>} />
              <Route path="panel" element={session.signedIn ? <Panel /> : <PublicPanel />} />
              <Route path="log" element={<Session><Log /></Session>} />
              <Route path="wallet" element={<Session><Wallet /></Session>} />
              <Route path="profile" element={<Session><Profile /></Session>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </TourProvider>
    </BrowserRouter>
  );
}

// The session, the gate, the theme, the status and the debug log are the
// package's AppShell; FieldData brings its routes, its instruments and its words.
export default function App() {
  const t = useT();
  return (
    <AppShell theme="dark" gateOptions={{ welcome: t("ui.app.welcome") }} signedOut={() => <Site />}>
      {() => <Site />}
    </AppShell>
  );
}
