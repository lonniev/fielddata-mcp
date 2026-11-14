/** A wait worth reading: the status line, then quotations on weather and climate. */

import { QuoteScroller } from "@tollbooth-dpyc/web/react";
import { WEATHER_QUOTES } from "../lib/quotes";

export default function Waiting({ heading }: { heading: string }) {
  return (
    <QuoteScroller
      quotes={WEATHER_QUOTES}
      heading={heading}
      spinner
      intervalMs={6000}
      classNames={{
        root: "waiting",
        heading: "waiting-head",
        figure: "waiting-figure",
        text: "waiting-text",
        mark: "waiting-mark",
        author: "waiting-author",
      }}
    />
  );
}
