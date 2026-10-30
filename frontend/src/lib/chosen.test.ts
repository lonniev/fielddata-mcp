import assert from "node:assert/strict";
import { test } from "node:test";
import { isChosen, shortStationId, toggleChoice, withoutStation } from "./chosen.ts";
import { VENDORS, standing } from "./vendors.ts";

const ID = "5bdb8963-9d54-46f8-854c-528d175f28ff";
const CHOICE = `ambient:441000:-733000:${shortStationId(ID)}`;

test("a short id matches the service's", () => {
  assert.equal(shortStationId(ID), "5bdb89639d5446f");
  assert.equal(shortStationId(shortStationId(ID)), "5bdb89639d5446f");
});

test("ticking adds, ticking again removes, and the rest stay", () => {
  const other = "ambient:1:2:abc";
  const on = toggleChoice([other], CHOICE);
  assert.deepEqual(on, [other, CHOICE]);
  assert.ok(isChosen(on, ID));
  assert.deepEqual(toggleChoice(on, CHOICE), [other]);
  assert.deepEqual(withoutStation(on, ID), [other]);
});

test("a station whose place moved is still the same station", () => {
  assert.deepEqual(toggleChoice([CHOICE], `ambient:441001:-733000:${shortStationId(ID)}`), []);
});

test("an account stands by whole pairs", () => {
  const [eco, amb] = VENDORS;
  const configured = [
    { field: "ecowitt_application_key", delivered_at: "2026-10-01" },
    { field: "ecowitt_api_key", delivered_at: "2026-10-02" },
    { field: "ambient_api_key" },
  ];
  assert.deepEqual(standing(eco, configured), { state: "connected", deliveredAt: "2026-10-02" });
  assert.equal(standing(amb, configured).state, "partial");
  assert.equal(standing(amb, []).state, "none");
});
