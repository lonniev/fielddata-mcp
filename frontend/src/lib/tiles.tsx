/** FieldData's decoration on the shared top-up tiles: farm-stand coupons. */

import { Carrot, Leaf, Sprout, Tractor, Wheat } from "lucide-react";
import type { DecorateTile } from "@tollbooth-dpyc/web/react";
import { tr, type Translate } from "../i18n/index.ts";

const LOOKS: Record<number, { name: Parameters<Translate>[0]; Mark: typeof Sprout }> = {
  100: { name: "lib.tiles.seedling", Mark: Sprout },
  500: { name: "lib.tiles.gardenRow", Mark: Leaf },
  1_000: { name: "lib.tiles.seedPacket", Mark: Carrot },
  5_000: { name: "lib.tiles.bushelBasket", Mark: Wheat },
  25_000: { name: "lib.tiles.fullSilo", Mark: Tractor },
};

export const decorateTile: DecorateTile = (sats) => {
  const look = LOOKS[sats];
  return look && { name: tr(look.name), mark: <look.Mark size={20} aria-hidden /> };
};
