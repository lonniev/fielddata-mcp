// Cloudflare Pages Function: /cafe/… → the Good Brew café's public catalog feed.
// Only the two catalog reads pass (see the package's makeCafeProxy); no cookie crosses it.
import { makeCafeProxy } from "@tollbooth-dpyc/web/pages-proxy";

export const onRequestGet = makeCafeProxy("FieldData-Catalog/1.0 (+https://fielddata.tollbooth-dpyc.com)");
