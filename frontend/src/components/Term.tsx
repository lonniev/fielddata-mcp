/**
 * A word the page uses, and what it means, revealed on demand: tap the word, get
 * the sentence, tap away or press Escape and it is gone. It acts when the finger
 * lifts, because the iPad can drop the click.
 */

import { useEffect, useRef, useState } from "react";
import { define } from "../lib/glossary";
import { useUnits } from "../lib/useUnits";

export default function Term({ of, label }: { of: string; label?: string }) {
  const [units] = useUnits();
  const entry = define(of);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  const lifted = useRef(false);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!entry) return <>{label}</>;
  return (
    <span ref={box} className="relative inline-block">
      <button
        type="button"
        aria-expanded={open}
        className="underline decoration-dotted underline-offset-4"
        onPointerUp={() => {
          lifted.current = true;
          setOpen((o) => !o);
        }}
        onClick={() => {
          if (!lifted.current) setOpen((o) => !o);
          lifted.current = false;
        }}
      >
        {label ?? entry.term}
      </button>
      {open && (
        <span role="note" className="site-menu left-0 block w-72 text-left text-sm font-normal normal-case">
          {entry.said(units)}
        </span>
      )}
    </span>
  );
}
