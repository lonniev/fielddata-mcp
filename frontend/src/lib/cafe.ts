/**
 * What FieldData shows of the Good Brew café: the collections it offers, in its
 * order. The reading is the package's (`cafeCollections`, through
 * functions/cafe); orders happen at the café, never here.
 */

import { cafeCollections as readCollections } from "@tollbooth-dpyc/web";

export { CAFE_URL, PRODUCT_PAGE_SIZE, cafeProducts, type CafeCollection, type CafeProduct } from "@tollbooth-dpyc/web";

/** The collections FieldData offers, in the order it offers them. */
export const OFFERED = ["terroir", "mcps", "dpyc-merch", "books"] as const;

export const cafeCollections = () => readCollections(OFFERED);
