/** The tours: the package's shared ones, and FieldData's own pages. */

import { accountTour, signInTour, walletTour, type Tour } from "@tollbooth-dpyc/web";

export const TOURS: Record<string, Tour> = {
  signin: signInTour(),
  wallet: walletTour(),
  account: accountTour("account", [
    { target: "keys", title: "Your station keys", says: "Send your station keys by Nostr message, and your stations appear on the panel." },
    { target: "nearby", title: "Nearby stations", says: "Tick stations near you, from the list or the map, and they join your own on the panel." },
    { target: "profile.units", title: "Units", says: "Choose metric or US figures for every instrument on this device." },
  ]),
  panel: { page: "panel", steps: [
    { target: "keys", title: "Connect your station", says: "Connect your Ecowitt or Ambient Weather account here, and your stations appear on the panel." },
    { target: "panel.station", title: "The station", says: "Pick any station you connected or ticked nearby, and the panel reads it." },
    { target: "panel.deck", title: "Your instruments", says: "Each sensor has its own instrument: tap one to see its last day." },
    { target: "panel.refresh", title: "Read again", says: "Tap here when you want a fresh reading." },
  ] },
  log: { page: "log", steps: [
    { target: "log.range", title: "The period", says: "Choose your days and the base temperature for degree-days." },
    { target: "log.table", title: "The days", says: "Each line is one local day at your station: tap a heading to sort." },
  ] },
};
