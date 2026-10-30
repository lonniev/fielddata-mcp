/** Balance, top-up, coupons and statement. */

import { useTour } from "@tollbooth-dpyc/web/react";
import WalletPanel from "../components/WalletPanel";

export default function Wallet() {
  useTour("wallet");
  return (
    <div className="page">
      <WalletPanel />
    </div>
  );
}
