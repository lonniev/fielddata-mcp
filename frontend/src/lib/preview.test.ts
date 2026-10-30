import assert from "node:assert/strict";
import { test } from "node:test";
import { previewDays, previewReadings, previewSeries } from "./preview.ts";

const NOW = Date.UTC(2026, 9, 30, 12);

test("the made-up station can never be taken for a vendor's", () => {
  for (const r of previewReadings(NOW)) assert.equal(r.vendor, "preview");
});

test("a trace ends on the reading its instrument shows", () => {
  for (const r of previewReadings(NOW)) {
    const { points } = previewSeries(r, NOW);
    assert.equal(points.length, 97);
    assert.ok(Math.abs(points[96][1] - r.quantity) < 1e-9, r.sensor_kind);
    assert.ok(points.every(([, q]) => q >= 0), r.sensor_kind);
  }
});

test("the week runs newest first and ends today", () => {
  const days = previewDays(NOW);
  assert.equal(days[0].date, "2026-10-30");
  assert.equal(days.at(-1)?.date, "2026-10-24");
});
