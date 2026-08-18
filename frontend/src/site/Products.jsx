import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { TrustBand } from './Layout';

function Stars({ value = 0 }) {
  const full = Math.round(value);
  return <span>{'★'.repeat(full)}{'☆'.repeat(Math.max(0, 5 - full))}</span>;
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/products`);
        const json = await res.json();
        if (on) setProducts(json.data || []);
      } catch { /* empty */ } finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, []);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort()],
    [products]
  );

  const filtered = products.filter((p) => {
    const okCat = cat === 'All' || p.category === cat;
    const s = q.trim().toLowerCase();
    const okSearch = !s || p.name.toLowerCase().includes(s) || (p.shortDesc || p.description || '').toLowerCase().includes(s);
    return okCat && okSearch;
  });

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="crumbs"><Link to="/">Home</Link> / Products</p>
          <h1>Our Products</h1>
          <p>Every product built on real, honestly-sourced ingredients and finished with patience.</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="shop-toolbar">
            <div className="cat-pills">
              {categories.map((c) => (
                <button key={c} className={`cat-pill${cat === c ? ' active' : ''}`} onClick={() => setCat(c)}>{c}</button>
              ))}
            </div>
            <input className="shop-search" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          {loading ? (
            <div className="site-loader">Loading products…</div>
          ) : filtered.length === 0 ? (
            <div className="empty-note">No products found.</div>
          ) : (
            <div className="shop-grid">
              {filtered.map((p) => {
                const hasOffer = p.offerPrice && p.offerPrice < p.price;
                const outOfStock = p.isPaused || p.inStock === false;
                const rating = p.avgRating || p.rating || 0;
                return (
                  <Link to={`/product/${p._id}`} className="shop-card" key={p._id}>
                    <div className="thumb">
                      {hasOffer && <span className="badge-offer">Offer</span>}
                      {p.imageUrl ? <img src={p.imageUrl} alt={p.name} /> : null}
                      {outOfStock && <span className="oos">Out of stock</span>}
                    </div>
                    <div className="body">
                      <span className="cat">{p.category}</span>
                      <h3>{p.name}</h3>
                      <div className="rating"><Stars value={rating} /> <span style={{ color: 'var(--ink-faint)' }}>({p.totalRatings || p.reviewCount || 0})</span></div>
                      <div className="price">
                        {hasOffer ? <><s>₹{p.price}</s>₹{p.offerPrice}</> : <>₹{p.price}</>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <TrustBand heading="Looking to stock Devine products?" />
    </>
  );
}
