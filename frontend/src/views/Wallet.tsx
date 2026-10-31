/** The wallet, the same on every Tollbooth DPYC™ site, with FieldData's tiles. */

import { Wallet as SharedWallet, useTour } from "@tollbooth-dpyc/web/react";
import { decorateTile } from "../lib/tiles";

export default function Wallet() {
  useTour("wallet");
  return (
    <div className="page">
      <SharedWallet decorateTile={decorateTile} />
    </div>
  );
}
