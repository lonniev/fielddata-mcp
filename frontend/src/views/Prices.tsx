/** Every tool and its live fare: the fleet's price sheet on the instrument room's palette. */

import { PriceSheet } from "@tollbooth-dpyc/web/react";

export default function Prices() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PriceSheet />
    </div>
  );
}
