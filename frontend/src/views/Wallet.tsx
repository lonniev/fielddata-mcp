/** Balance, top-up, coupons and statement: the package's wallet, with the wallet chooser beside it. */

import { formatDateTime } from "@tollbooth-dpyc/web";
import { WalletChooser, WalletPage, useTimezone, useTour } from "@tollbooth-dpyc/web/react";

export default function Wallet() {
  useTour("wallet");
  const [, zone] = useTimezone();
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <WalletPage
        topUps={[1_000, 5_000, 25_000]}
        formatDateTime={(iso) => formatDateTime(iso, zone)}
        before={<WalletChooser className="chip mb-4" />}
        coupons={{ classNames: { root: "card p-5", chip: "chip", primary: "chip chip-accent" } }}
        classNames={{ section: "card p-5", figure: "font-mono text-3xl", chip: "chip", chipActive: "chip chip-on", primary: "chip chip-accent" }}
      />
    </div>
  );
}
