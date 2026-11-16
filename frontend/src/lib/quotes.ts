/** Quotations for a wait: weather, climate, and the sky's moods. */

import type { Quote } from "@tollbooth-dpyc/web";
import { tr, type Translate } from "../i18n/index.ts";

/** A quotation's words by key; its author by name, or by key for a saying nobody wrote. */
const QUOTES: { text: Parameters<Translate>[0]; author: string | { key: "lib.quotes.saying" | "lib.quotes.lore" } }[] = [
  { text: "lib.quotes.badMoon", author: "Creedence Clearwater Revival" },
  { text: "lib.quotes.weatherman", author: "Bob Dylan" },
  { text: "lib.quotes.forecast", author: "George Carlin" },
  { text: "lib.quotes.talks", author: "Charles Dudley Warner" },
  { text: "lib.quotes.climate", author: { key: "lib.quotes.saying" } },
  { text: "lib.quotes.redSky", author: { key: "lib.quotes.lore" } },
  { text: "lib.quotes.mackerel", author: { key: "lib.quotes.lore" } },
  { text: "lib.quotes.dew", author: { key: "lib.quotes.lore" } },
  { text: "lib.quotes.matthew", author: "Matthew 16:2" },
  { text: "lib.quotes.ecclesiastes", author: "Ecclesiastes 11:4" },
  { text: "lib.quotes.job", author: "Job 38:22" },
  { text: "lib.quotes.longfellow", author: "Henry Wadsworth Longfellow" },
  { text: "lib.quotes.proust", author: "Marcel Proust" },
];

/** The quotations in the language `t` speaks. */
export const weatherQuotes = (t: Translate = tr): Quote[] =>
  QUOTES.map((q) => ({ text: t(q.text), author: typeof q.author === "string" ? q.author : t(q.author.key) }));
