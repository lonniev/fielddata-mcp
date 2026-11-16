/** A wait worth reading: the status line, then quotations on weather and climate. */

import { useMemo } from "react";
import { QuoteScroller } from "@tollbooth-dpyc/web/react";
import { useT } from "../i18n";
import { weatherQuotes } from "../lib/quotes";

export default function Waiting({ heading }: { heading: string }) {
  const t = useT();
  const quotes = useMemo(() => weatherQuotes(t), [t]);
  return (
    <QuoteScroller
      quotes={quotes}
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
