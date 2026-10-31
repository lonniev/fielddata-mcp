/** FieldData's decoration on the shared top-up tiles: farm-stand coupons. */

import { Carrot, Leaf, Sprout, Tractor, Wheat, Wind } from "lucide-react";
import type { DecorateTile } from "@tollbooth-dpyc/web/react";

const LOOKS: Record<number, { name: string; Mark: typeof Sprout }> = {
  10: { name: "Single Seed", Mark: Wind },
  100: { name: "Seedling", Mark: Sprout },
  500: { name: "Garden Row", Mark: Leaf },
  1_000: { name: "Seed Packet", Mark: Carrot },
  5_000: { name: "Bushel Basket", Mark: Wheat },
  25_000: { name: "Full Silo", Mark: Tractor },
};

export const decorateTile: DecorateTile = (sats) => {
  const look = LOOKS[sats];
  return look && { name: look.name, mark: <look.Mark size={20} aria-hidden /> };
};
