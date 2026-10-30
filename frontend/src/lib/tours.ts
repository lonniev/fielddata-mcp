/** The tours: the package's two shared ones, and FieldData's own pages. */

import { accountTour, signInTour, type Tour } from "@tollbooth-dpyc/web";

export const TOURS: Record<string, Tour> = {
  signin: signInTour(),
  account: accountTour("account", [
    { target: "keys", title: "Your station", says: "Your Ecowitt keys travel by Nostr message and never touch this page." },
    { target: "profile.units", title: "Units", says: "Choose metric or US figures for every instrument on this device." },
  ]),
  panel: { page: "panel", steps: [
    { target: "keys", title: "Connect your station", says: "Connect your Ecowitt account here, and your stations appear on the panel." },
    { target: "panel.station", title: "Your station", says: "This is the station the panel is reading." },
    { target: "panel.deck", title: "Your instruments", says: "Each sensor has its own instrument: tap one to see its last day." },
    { target: "panel.refresh", title: "Read again", says: "Tap here when you want a fresh reading." },
  ] },
  log: { page: "log", steps: [
    { target: "log.range", title: "The period", says: "Choose your days and the base temperature for degree-days." },
    { target: "log.table", title: "The days", says: "Each line is one local day at your station: tap a heading to sort." },
  ] },
};
