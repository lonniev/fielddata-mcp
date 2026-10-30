/** FieldData's words on the package's bring-your-own-keys panel. */

import { PatronCredentialsPanel } from "@tollbooth-dpyc/web/react";

export default function StationKeys({ npub, onConnected }: { npub: string; onConnected?: () => void }) {
  return (
    <div data-tour="keys">
      <PatronCredentialsPanel
        npub={npub}
        heading="Your station account"
        connectedText="FieldData reads your stations under your own Ecowitt keys."
        inviteText="Make an Application Key and an API Key at ecowitt.net, then connect: you reply to a Nostr message with both keys."
        keySource={{ href: "https://www.ecowitt.net/user/index", label: "Make your keys", title: "Your Ecowitt account's API settings" }}
        onConnected={onConnected}
        classNames={{ root: "card p-5", primary: "chip chip-accent", chip: "chip", link: "text-[var(--tb-accent)]" }}
      />
    </div>
  );
}
