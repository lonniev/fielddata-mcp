/**
 * A word the page uses, and what it means, revealed on demand. The disclosure
 * is the package's `Term` (it opens on the finger's lift, and closes on a press
 * elsewhere, on Escape or after a reading time); the word and its meaning are
 * FieldData's glossary, in the reader's language and units.
 */

import { Term as Disclosure } from "@tollbooth-dpyc/web/react";
import { useT } from "../i18n";
import { define } from "../lib/glossary";
import { useUnits } from "../lib/useUnits";

const LOOK = {
  word: "underline decoration-dotted underline-offset-4",
  panel: "site-menu block w-72 text-left text-sm font-normal normal-case",
};

export default function Term({ of, label }: { of: string; label?: string }) {
  useT(); // the word and its meaning follow the reader's language
  const [units] = useUnits();
  const entry = define(of);
  if (!entry) return <>{label}</>;
  return <Disclosure label={label ?? entry.term()} said={entry.said(units)} align="left" classNames={LOOK} />;
}
