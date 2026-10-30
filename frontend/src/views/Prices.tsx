/** Every tool and its live fare: the fleet's price sheet on the instrument room's palette. */

import { PriceSheet } from "@tollbooth-dpyc/web/react";

export default function Prices() {
  return (
    <div className="page">
      <div className="card p-5"><PriceSheet /></div>
    </div>
  );
}
