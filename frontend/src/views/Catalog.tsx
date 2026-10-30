/** The Good Brew café's collections and what each holds, read live. Orders are taken at the café. */

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PageControls } from "@tollbooth-dpyc/web/react";
import { CollectionTile } from "../components/Cafe";
import { CAFE_URL, PRODUCT_PAGE_SIZE, cafeCollections, cafeProducts, type CafeCollection, type CafeProduct } from "../lib/cafe";

function Trouble({ text }: { text: string }) {
  return <p className="card p-5 text-sm">{text} <a href={CAFE_URL} target="_blank" rel="noopener noreferrer" className="underline">Visit the café</a></p>;
}

function useCollections() {
  const [found, setFound] = useState<CafeCollection[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    cafeCollections().then((c) => { if (live) setFound(c); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, []);
  return { found, failed };
}

/** A few collections, for a page that is about something else. */
export function CafeShelf({ count }: { count: number }) {
  const { found } = useCollections();
  if (!found?.length) return null;
  return (
    <section className="space-y-3">
      <div className="card flex flex-wrap items-center gap-3 p-5">
        <div>
          <h2 className="text-xl">From the Good Brew café</h2>
          <p className="prose-line text-sm">The instruments for knowing your own terroir, with books and merchandise to go with them.</p>
        </div>
        <Link to="/catalog" className="chip ml-auto">The whole catalog</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {found.slice(0, count).map((c) => <CollectionTile key={c.handle} c={c} />)}
      </div>
    </section>
  );
}

export default function Catalog() {
  const { found, failed } = useCollections();
  return (
    <div className="page space-y-4">
      <header className="card flex flex-wrap items-center gap-3 p-5">
        <div>
          <h1 className="text-3xl">Catalog</h1>
          <p className="prose-line mt-1 text-sm">The Good Brew café is FieldData's sibling storefront, and every order is placed at the café.</p>
        </div>
        <a href={CAFE_URL} target="_blank" rel="noopener noreferrer" className="chip chip-accent ml-auto">Visit the café <ExternalLink size={14} aria-hidden /></a>
      </header>
      {failed && <Trouble text="The café's shelves could not be read just now." />}
      {!found && !failed && <p className="card p-5 text-sm" aria-busy="true">Reading the café's shelves…</p>}
      {found && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {found.map((c) => <CollectionTile key={c.handle} c={c} />)}
        </div>
      )}
    </div>
  );
}

export function CatalogCollection() {
  const { handle = "" } = useParams();
  const { found } = useCollections();
  const [page, setPage] = useState(0);
  const [products, setProducts] = useState<CafeProduct[] | null>(null);
  const [failed, setFailed] = useState(false);
  const collection = found?.find((c) => c.handle === handle);

  useEffect(() => {
    let live = true;
    setProducts(null);
    setFailed(false);
    cafeProducts(handle, page).then((p) => { if (live) setProducts(p); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [handle, page]);

  const controls = { root: "flex flex-wrap items-center justify-center gap-2 text-sm", chip: "chip", label: "px-2" };
  return (
    <div className="page space-y-4">
      <header className="card flex flex-wrap items-center gap-3 p-5">
        <div className="min-w-0 flex-1 basis-80">
          <Link to="/catalog" className="text-sm underline">Catalog</Link>
          <h1 className="text-3xl">{collection?.title ?? handle}</h1>
          {collection?.says && <p className="prose-line mt-1 text-sm">{collection.says}</p>}
        </div>
        <a href={collection?.url ?? `${CAFE_URL}/collections/${handle}`} target="_blank" rel="noopener noreferrer" className="chip chip-accent">
          Shop this collection <ExternalLink size={14} aria-hidden />
        </a>
      </header>
      {failed && <Trouble text="This collection could not be read just now." />}
      {!products && !failed && <p className="card p-5 text-sm" aria-busy="true">Reading the collection…</p>}
      {products && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <a key={p.handle} href={p.url} target="_blank" rel="noopener noreferrer" className="card tile">
              {p.image ? <img src={p.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="tile-image" /> : <span className="tile-image tile-blank" />}
              <span className="block p-3">
                <span className="block text-sm font-medium">{p.title}</span>
                {p.kind && <span className="prose-line block text-xs">{p.kind}</span>}
              </span>
            </a>
          ))}
        </div>
      )}
      {collection && (
        <div className="card p-3">
          <PageControls page={page} pageSize={PRODUCT_PAGE_SIZE} total={collection.count} onPage={setPage} hideSinglePage classNames={controls} />
        </div>
      )}
    </div>
  );
}
