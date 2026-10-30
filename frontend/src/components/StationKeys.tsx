/** FieldData's words on the package's bring-your-own-keys panel. */

import type { ReactNode } from "react";
import { PatronCredentialsPanel } from "@tollbooth-dpyc/web/react";

function Vendor({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--tb-accent)] underline">{children}</a>;
}

export default function StationKeys({ npub, onConnected }: { npub: string; onConnected?: () => void }) {
  return (
    <div data-tour="keys">
      <PatronCredentialsPanel
        npub={npub}
        heading="Your station account"
        connectedText="FieldData reads your stations under your own keys."
        inviteText={
          <>
            Make an Application Key and an API Key at <Vendor href="https://www.ecowitt.net/user/index">Ecowitt</Vendor> or{" "}
            <Vendor href="https://ambientweather.net/account">Ambient Weather</Vendor>, then connect: you reply to a Nostr message with both keys of each account.
          </>
        }
                onConnected={onConnected}
        classNames={{ root: "card p-5", primary: "chip chip-accent", chip: "chip", link: "text-[var(--tb-accent)]" }}
      />
    </div>
  );
}
