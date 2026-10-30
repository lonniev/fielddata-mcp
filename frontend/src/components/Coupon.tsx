/** A top-up amount as a farm-stand coupon: a ticket with a torn stub, ready to tap. */

import type { ReactNode } from "react";
import { Sprout, Tractor, Wheat } from "lucide-react";
import type { TopUpOffer } from "@tollbooth-dpyc/web/react";

const NAMES: Record<number, { name: string; mark: ReactNode }> = {
  1_000: { name: "Seed Packet", mark: <Sprout size={26} aria-hidden /> },
  5_000: { name: "Bushel Basket", mark: <Wheat size={26} aria-hidden /> },
  25_000: { name: "Full Silo", mark: <Tractor size={26} aria-hidden /> },
};

export const COUPON_AMOUNTS = Object.keys(NAMES).map(Number);

export default function Coupon({ sats, offer }: { sats: number; offer: TopUpOffer }) {
  const { name, mark } = NAMES[sats] ?? { name: "Coupon", mark: <Sprout size={26} aria-hidden /> };
  return (
    <button type="button" className="coupon" disabled={offer.disabled} aria-pressed={offer.chosen} onClick={offer.pick}>
      <span className="coupon-stub">{mark}</span>
      <span className="coupon-body">
        <span className="coupon-name">{name}</span>
        <span className="coupon-sats">{sats.toLocaleString("en-US")}</span>
        <span className="coupon-small">sats of credit</span>
      </span>
    </button>
  );
}
