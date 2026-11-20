/**
 * Terms of use. A draft for the owner's review: nothing here has had legal review.
 * The terms stay in English, the language they are written and read in; only the
 * heading follows the reader's language.
 *
 * FieldData writes only its own sections. Keys, fees, the café and the marks are
 * the package's, the same on every Tollbooth site.
 */

import { termsOfUse } from "@tollbooth-dpyc/web";
import { TermsOfUse as Page } from "@tollbooth-dpyc/web/react";
import { useT } from "../i18n";

const SECTIONS = termsOfUse({
  name: "FieldData",
  cafe: true,
  own: [
    { title: "The service", says: [
      "FieldData returns readings from weather stations and soil probes on your own vendor account.",
      "It is provided as is, and readings may be late, missing or wrong: check them before you rely on them for a decision about your crop, your property or your safety.",
    ] },
    { title: "Your keys", says: [
      "You deliver your vendor keys by Nostr message, and the operator stores them encrypted under your npub.",
      "You may delete them at any time, and you remain responsible for your vendor account and its terms.",
    ] },
    { title: "Your data", says: [
      "FieldData passes readings through to you and holds them in a one-minute cache.",
      "Tool calls and balances are recorded so your account can be kept and audited.",
    ] },
    { title: "Nearby stations", says: [
      "A nearby station's readings are what its owner publishes, and FieldData makes no claim for their accuracy.",
    ] },
  ],
  marks: ["Ecowitt and Ambient Weather are trademarks of their owners, and no affiliation or endorsement is implied."],
});

export default function Terms() {
  const t = useT();
  return (
    <div className="page space-y-4">
      <Page
        heading={t("views.termsOfUse.title")}
        sections={SECTIONS}
        classNames={{
          root: "space-y-4", header: "card p-5", heading: "text-3xl", sections: "gap-4",
          section: "card p-5 mb-4", title: "text-lg", line: "prose-line mt-1 text-sm",
        }}
      />
    </div>
  );
}
