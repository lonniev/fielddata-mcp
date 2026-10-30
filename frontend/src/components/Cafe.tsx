/** A café collection on a shelf. The tile opens the collection here; ordering is at the café. */

import { Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import type { CafeCollection } from "../lib/cafe";

export function CollectionTile({ c }: { c: CafeCollection }) {
  return (
    <Link to={`/catalog/${c.handle}`} className="card tile">
      {c.image ? (
        <img src={c.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="tile-image" />
      ) : (
        <span className="tile-image tile-blank"><Sprout size={44} aria-hidden /></span>
      )}
      <span className="block p-4">
        <span className="font-display block text-lg">{c.title}</span>
        <span className="prose-line tile-says mt-1 text-sm">{c.says}</span>
      </span>
    </Link>
  );
}
