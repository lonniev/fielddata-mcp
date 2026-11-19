import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCollections } from "@tollbooth-dpyc/web";
import { OFFERED } from "./cafe.ts";

test("FieldData's shelf holds its own collections, in its own order", () => {
  const found = parseCollections({ collections: [
    { handle: "books", title: "Books", products_count: 3 },
    { handle: "coffees", title: "Coffees", products_count: 9 },
    { handle: "mcps", title: "MCPs", products_count: 21 },
    { handle: "terroir", title: "Terroir", products_count: 6 },
  ] }, OFFERED);
  assert.deepEqual(found.map((c) => c.handle), ["terroir", "mcps", "books"]);
});
