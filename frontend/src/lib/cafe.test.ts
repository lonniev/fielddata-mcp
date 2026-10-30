import assert from "node:assert/strict";
import { test } from "node:test";
import { upstreamFor } from "../../functions/cafe/[[path]].js";
import { parseCollections, parseProducts, plainText } from "./cafe.ts";

test("the proxy passes the two catalog reads and nothing else", () => {
  assert.equal(upstreamFor("/cafe/collections.json"), "https://cafe.tollbooth-dpyc.com/collections.json");
  assert.equal(
    upstreamFor("/cafe/collections/books/products.json", "?page=2"),
    "https://cafe.tollbooth-dpyc.com/collections/books/products.json?limit=24&page=2",
  );
  for (const path of ["/cafe/cart.json", "/cafe/admin/api/orders.json", "/cafe/collections/../admin/products.json", "/cafe/collections/a%2Fb/products.json", "/cafe/collections/books/products.json/x"]) {
    assert.equal(upstreamFor(path), null, path);
  }
  for (const search of ["?page=0", "?page=-1", "?page=x", "?page=1.5"]) {
    assert.equal(upstreamFor("/cafe/collections/books/products.json", search), null, search);
  }
});

test("a store description reaches the page as plain words", () => {
  assert.equal(plainText("<p>Tea &amp; <b>coffee</b></p><script>x()</script>"), "Tea & coffee x()");
  assert.equal(plainText(null), "");
});

test("collections hold something, name a safe handle and show only the store's images", () => {
  const found = parseCollections({ collections: [
    { handle: "books", title: "Books", products_count: 3, image: { src: "https://evil.example/x.png" } },
    { handle: "empty", title: "Empty", products_count: 0 },
    { handle: "../up", title: "Up", products_count: 2 },
    { handle: "coffees", title: "Coffees", products_count: 9 },
    { handle: "mcps", title: "MCPs", products_count: 21 },
    { handle: "terroir", title: "Terroir", products_count: 6, image: { src: "https://cdn.shopify.com/t.png" }, description: "<p>Soil</p>" },
  ] });
  assert.deepEqual(found.map((c) => c.handle), ["terroir", "mcps", "books"]);
  assert.equal(found[0].says, "Soil");
  assert.equal(found[0].image, "https://cdn.shopify.com/t.png");
  assert.equal(found[2].image, null);
  assert.equal(found[2].url, "https://cafe.tollbooth-dpyc.com/collections/books");
});

test("a malformed feed is an empty shelf", () => {
  assert.deepEqual(parseCollections(null), []);
  assert.deepEqual(parseProducts({ products: "no" }), []);
  assert.equal(parseProducts({ products: [{ handle: "mug", title: "Mug" }] })[0].url, "https://cafe.tollbooth-dpyc.com/products/mug");
});
