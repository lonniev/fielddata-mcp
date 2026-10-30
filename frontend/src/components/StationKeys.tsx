/** One row per station account: its standing, and the way to connect, replace or remove its keys. Keys travel by Secure Courier and never touch this page. */

import { useCallback, useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  deletePatronCredential,
  formatDateTime,
  getPatronOnboardingStatus,
  receivePatronCredentials,
  requestPatronCredentials,
  type PatronOnboardingResult,
} from "@tollbooth-dpyc/web";
import { useTimezone } from "@tollbooth-dpyc/web/react";
import { VENDORS, standing, type VendorAccount } from "../lib/vendors";

type Exchange = { vendor: string; phrase: string; relay: string };

const LABELS = { connected: "Connected", partial: "One key on file", none: "Not connected" };

export default function StationKeys({ npub, onConnected }: { npub: string; onConnected?: () => void }) {
  const [, zone] = useTimezone();
  const [status, setStatus] = useState<PatronOnboardingResult | null>(null);
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [removing, setRemoving] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  const check = useCallback(async () => setStatus(await getPatronOnboardingStatus(npub)), [npub]);

  async function attempt(step: () => Promise<void>) {
    setBusy(true);
    setProblem("");
    try {
      await step();
    } catch (e) {
      setProblem((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void attempt(check);
    // eslint-disable-next-line
  }, [check]);

  const open = (vendor: VendorAccount) =>
    attempt(async () => {
      const r = await requestPatronCredentials(npub);
      if (!r.success || !r.nonce) throw new Error(r.message ?? "The invitation could not be sent.");
      setExchange({ vendor: vendor.id, phrase: r.nonce, relay: r.rendezvous_relay ?? "" });
    });

  const collect = (phrase: string) =>
    attempt(async () => {
      const r = await receivePatronCredentials(npub, phrase);
      if (!r.success || !(r.stored_fields ?? []).length) {
        throw new Error(r.error ?? r.message ?? "No reply found yet: send it, then try again.");
      }
      setExchange(null);
      await check();
      onConnected?.();
    });

  const remove = (vendor: VendorAccount) =>
    attempt(async () => {
      for (const field of vendor.fields) await deletePatronCredential(field);
      setRemoving("");
      await check();
      onConnected?.();
    });

  return (
    <section data-tour="keys" className="card p-5 lg:col-span-2">
      <h2 className="font-display text-lg">Your station accounts</h2>
      <p className="prose-line mb-3 text-sm">Your keys travel by Nostr message and are stored encrypted, and this page never sees them.</p>
      <ul className="divide-y divide-[var(--tb-line)]">
        {VENDORS.map((vendor) => {
          const { state, deliveredAt } = standing(vendor, status?.configured ?? []);
          const mine = exchange?.vendor === vendor.id ? exchange : null;
          return (
            <li key={vendor.id} className="space-y-2 py-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="min-w-40 flex-1">
                  <div className="font-medium">{vendor.label}</div>
                  <div className={`text-xs ${state === "connected" ? "text-[var(--tb-ok)]" : "text-[var(--tb-muted)]"}`}>
                    {status ? LABELS[state] : "Checking…"}
                    {state === "connected" && deliveredAt && ` · delivered ${formatDateTime(deliveredAt, zone)}`}
                  </div>
                </div>
                <a href={vendor.keysAt} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-[var(--tb-accent)]">
                  Make your keys <ExternalLink size={14} aria-hidden />
                </a>
                <button type="button" className={state === "connected" ? "chip" : "chip chip-accent"} disabled={busy || !status} onClick={() => void open(vendor)}>
                  {state === "connected" ? "Replace keys" : "Connect"}
                </button>
                {state !== "none" && (removing === vendor.id ? (
                  <>
                    <button type="button" className="chip" disabled={busy} onClick={() => void remove(vendor)}>Yes, remove</button>
                    <button type="button" className="chip" disabled={busy} onClick={() => setRemoving("")}>Keep</button>
                  </>
                ) : (
                  <button type="button" className="chip" disabled={busy} onClick={() => setRemoving(vendor.id)}>Remove</button>
                ))}
              </div>
              {mine && (
                <div className="space-y-2 rounded-lg bg-[var(--tb-surface-2)] p-3 text-sm">
                  <p>Check your Nostr messages for one marked <span className="font-mono">{mine.phrase}</span>, and reply with your {vendor.label} keys.</p>
                  {mine.relay && <p className="text-xs text-[var(--tb-muted)]">Reply on <span className="font-mono">{mine.relay}</span>: replies elsewhere are missed.</p>}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="chip chip-accent" disabled={busy} onClick={() => void collect(mine.phrase)}>I replied</button>
                    <button type="button" className="chip" disabled={busy} onClick={() => setExchange(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {problem && <p className="mt-2 text-sm text-[var(--tb-err-ink)]">{problem}</p>}
    </section>
  );
}
