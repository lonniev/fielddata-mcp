import assert from "node:assert/strict";
import { test } from "node:test";
import { GLOSSARY, GROUPS, define, searchGlossary } from "./glossary.ts";
import { formatDistance, formatWhole, kmFromInput, radiusChoices } from "./units.ts";
import { INSTRUMENT_KINDS } from "./instruments.ts";

test("every instrument on the panel has a definition", () => {
  for (const kind of INSTRUMENT_KINDS) assert.ok(define(kind), kind);
});

test("the words the owner named can be found", () => {
  for (const word of ["pyranometer", "barometric", "GDD"]) assert.ok(searchGlossary(word, "si").length, word);
});

test("a definition speaks the patron's units and never the other's", () => {
  const frost = define("frost_hours")!;
  assert.match(frost.said("us"), /32 °F/);
  assert.doesNotMatch(frost.said("us"), /°C/);
  assert.match(frost.said("si"), /0 °C/);
  for (const entry of GLOSSARY) assert.doesNotMatch(entry.said("us"), /°C|\bkm\b|\bmm\b|hPa/, entry.key);
});

test("every entry sits in a group that exists", () => {
  const ids = new Set(GROUPS.map((g) => g.id));
  for (const entry of GLOSSARY) assert.ok(ids.has(entry.group), entry.key);
});

test("whole-number text and distances follow the units", () => {
  assert.equal(formatWhole(10, "°C", "us"), "50 °F");
  assert.equal(formatWhole(10, "°C", "si"), "10 °C");
  assert.equal(formatDistance(16.09, "us"), "10.0 mi");
  assert.equal(formatDistance(16.09, "si"), "16.1 km");
  assert.equal(kmFromInput(10, "us").toFixed(2), "16.09");
  assert.equal(kmFromInput(15, "si"), 15);
  assert.ok(radiusChoices("us").every((c) => c.km <= 100));
  assert.ok(radiusChoices("si").every((c) => c.km <= 100));
  assert.equal(radiusChoices("us")[1].label, "10 mi");
});
