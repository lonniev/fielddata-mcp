/** The package's wallet with FieldData's coupons and wallet chooser, whole on the Wallet page and brief on Profile. */

import { formatDateTime } from "@tollbooth-dpyc/web";
import { WalletChooser, WalletPage, useTimezone } from "@tollbooth-dpyc/web/react";
import Coupon, { COUPON_AMOUNTS } from "./Coupon";

const COUPONS = {
  root: "card p-5",
  heading: "font-display mb-1 text-lg",
  intro: "prose-line text-sm",
  form: "mt-3 flex flex-wrap items-center gap-2",
  input: "field",
  chip: "chip",
  primary: "chip chip-accent",
  subheading: "font-display mt-4 mb-1",
  message: "mt-2 text-sm",
  ok: "text-[var(--tb-ok)]",
  error: "text-[var(--tb-err-ink)]",
  loading: "prose-line mt-2 text-sm",
  empty: "prose-line mt-2 text-sm",
  list: "divide-y divide-[var(--tb-line)] text-sm",
  row: "flex flex-wrap items-center justify-between gap-x-4 py-2",
  meta: "text-[var(--tb-muted)]",
};

export default function WalletPanel({ brief = false }: { brief?: boolean }) {
  const [, zone] = useTimezone();
  return (
    <WalletPage
      heading={brief ? null : "Wallet"}
      statement={!brief}
      topUps={COUPON_AMOUNTS}
      renderTopUp={(sats, offer) => <Coupon sats={sats} offer={offer} />}
      topUpAside={<WalletChooser />}
      formatDateTime={(iso) => formatDateTime(iso, zone)}
      coupons={brief ? false : { classNames: COUPONS }}
      classNames={{
        root: "wallet",
        heading: "card p-5 text-3xl",
        section: "card p-5",
        sectionTitle: "font-display mt-2 mb-2 text-lg first:mt-0",
        figure: "font-mono text-4xl text-[var(--tb-accent)]",
        unit: "text-sm text-[var(--tb-muted)]",
        stats: "mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--tb-muted)]",
        notice: "mt-2 text-sm text-[var(--tb-muted)]",
        error: "mt-2 text-sm text-[var(--tb-err-ink)]",
        status: "mt-2 text-sm text-[var(--tb-muted)]",
        chip: "chip",
        chipActive: "chip chip-on",
        primary: "chip chip-accent",
        chips: "mt-3 flex flex-wrap items-center gap-2",
        topUpRow: "coupon-row",
        input: "field",
        invoice: "space-y-2",
        bolt11: "break-all rounded-lg bg-[var(--tb-surface-2)] p-3 font-mono text-xs",
        list: "divide-y divide-[var(--tb-line)] text-sm",
        row: "flex flex-wrap justify-between gap-x-4 py-2",
      }}
    />
  );
}
