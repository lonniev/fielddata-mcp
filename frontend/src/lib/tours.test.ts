import assert from "node:assert/strict";
import { test } from "node:test";
import { lintTours } from "@tollbooth-dpyc/web";
import { tours } from "./tours.ts";
import { registerFieldData } from "../i18n/index.ts";

await registerFieldData();

test("every page that asks for a tour has one, in the network's voice", () => {
  const TOURS = tours();
  for (const page of ["signin", "wallet", "account", "panel", "log"]) assert.ok(TOURS[page], page);
  assert.deepEqual(lintTours(TOURS), []);
});
