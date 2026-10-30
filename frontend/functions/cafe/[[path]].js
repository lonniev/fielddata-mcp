// Cloudflare Pages Function: /cafe/… → the Good Brew café's public catalog feed.
// The store sends no CORS headers, so the browser reads it through here. Only the
// two catalog reads pass: this is no general proxy, and no cookie crosses it.
const CAFE = "https://cafe.tollbooth-dpyc.com";
const PAGE_SIZE = 24;
const HANDLE = /^[a-z0-9][a-z0-9-]{0,99}$/;

/** The store URL a request may read, or null. */
export function upstreamFor(pathname, search = "") {
  if (pathname === "/cafe/collections.json") return `${CAFE}/collections.json`;
  const match = pathname.match(/^\/cafe\/collections\/([^/]+)\/products\.json$/);
  if (!match || !HANDLE.test(match[1])) return null;
  const page = Number(new URLSearchParams(search).get("page") ?? 1);
  if (!Number.isInteger(page) || page < 1 || page > 1000) return null;
  return `${CAFE}/collections/${match[1]}/products.json?limit=${PAGE_SIZE}&page=${page}`;
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const upstream = upstreamFor(url.pathname, url.search);
  if (!upstream) return new Response("Not found", { status: 404 });
  const answer = await fetch(upstream, {
    headers: { accept: "application/json" },
    cf: { cacheTtl: 900, cacheEverything: true },
  });
  if (!answer.ok) return new Response("The café did not answer", { status: 502 });
  return new Response(answer.body, {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=900" },
  });
}
