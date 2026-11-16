/** The tours: the package's shared ones, and FieldData's own pages. */

import { accountTour, signInTour, walletTour, type Tour } from "@tollbooth-dpyc/web";
import { tr, type Translate } from "../i18n/index.ts";

/** Every tour, in the language `t` speaks: build them again when the language changes. */
export function tours(t: Translate = tr): Record<string, Tour> {
  return {
    signin: signInTour(),
    wallet: walletTour(),
    account: accountTour("account", [
      { target: "keys", title: t("lib.tours.account.keys.title"), says: t("lib.tours.account.keys.says") },
      { target: "nearby", title: t("lib.tours.account.nearby.title"), says: t("lib.tours.account.nearby.says") },
      { target: "profile.units", title: t("lib.tours.account.units.title"), says: t("lib.tours.account.units.says") },
    ]),
    panel: { page: "panel", steps: [
      { target: "keys", title: t("lib.tours.panel.keys.title"), says: t("lib.tours.panel.keys.says") },
      { target: "panel.station", title: t("lib.tours.panel.station.title"), says: t("lib.tours.panel.station.says") },
      { target: "panel.deck", title: t("lib.tours.panel.deck.title"), says: t("lib.tours.panel.deck.says") },
      { target: "panel.refresh", title: t("lib.tours.panel.refresh.title"), says: t("lib.tours.panel.refresh.says") },
    ] },
    log: { page: "log", steps: [
      { target: "log.range", title: t("lib.tours.log.range.title"), says: t("lib.tours.log.range.says") },
      { target: "log.table", title: t("lib.tours.log.table.title"), says: t("lib.tours.log.table.says") },
    ] },
  };
}
