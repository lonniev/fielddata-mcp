/** The Good Brew café's collections, read live. Orders happen at the café, never here. */

export const CAFE_URL = "https://cafe.tollbooth-dpyc.com";
export const PRODUCT_PAGE_SIZE = 24;

export interface CafeCollection {
  handle: string;
  title: string;
  says: string;
  image: string | null;
  count: number;
  url: string;
}

export interface CafeProduct {
  handle: string;
  title: string;
  kind: string;
  image: string | null;
  url: string;
}

const HANDLE = /^[a-z0-9][a-z0-9-]*$/;
const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };

/** A store description as plain words. React escapes what is left, so no markup reaches the page. */
export function plainText(html: unknown): string {
  if (typeof html !== "string") return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (_, e: string) => ENTITIES[e])
    .replace(/\s+/g, " ")
    .trim();
}

/** Only the store's own image host is shown. */
function imageOf(src: unknown): string | null {
  return typeof src === "string" && src.startsWith("https://cdn.shopify.com/") ? src : null;
}

/** Collections that hold something, the ones grown from the ground first. */
export function parseCollections(feed: unknown): CafeCollection[] {
  const rows = (feed as { collections?: Record<string, unknown>[] })?.collections;
  if (!Array.isArray(rows)) return [];
  const found = rows.flatMap((c) => {
    const handle = String(c.handle ?? "");
    const count = Number(c.products_count ?? 0);
    if (!HANDLE.test(handle) || !(count > 0)) return [];
    return [{
      handle,
      title: String(c.title ?? handle),
      says: plainText(c.description),
      image: imageOf((c.image as { src?: unknown } | null)?.src),
      count,
      url: `${CAFE_URL}/collections/${handle}`,
    }];
  });
  const rank = (c: CafeCollection) => (c.handle === "terroir" ? 0 : c.handle === "coffees" ? 1 : 2);
  return found.sort((a, b) => rank(a) - rank(b));
}

export function parseProducts(feed: unknown): CafeProduct[] {
  const rows = (feed as { products?: Record<string, unknown>[] })?.products;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((p) => {
    const handle = String(p.handle ?? "");
    if (!HANDLE.test(handle)) return [];
    const images = p.images as { src?: unknown }[] | undefined;
    return [{
      handle,
      title: String(p.title ?? handle),
      kind: String(p.product_type ?? ""),
      image: imageOf(images?.[0]?.src),
      url: `${CAFE_URL}/products/${handle}`,
    }];
  });
}

async function readFeed(path: string): Promise<unknown> {
  const answer = await fetch(path);
  if (!answer.ok) throw new Error("The café did not answer.");
  return answer.json();
}

export const cafeCollections = async () => parseCollections(await readFeed("/cafe/collections.json"));

/** `page` is zero-based, like the package's page controls. */
export const cafeProducts = async (handle: string, page: number) =>
  parseProducts(await readFeed(`/cafe/collections/${handle}/products.json?page=${page + 1}`));
