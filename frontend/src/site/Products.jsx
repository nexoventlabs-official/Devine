import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { TrustBand } from './Layout';
import { useCart } from '../context/CartContext';

function Stars({ value = 0 }) {
  const full = Math.round(value);
  return <span>{'★'.repeat(full)}{'☆'.repeat(Math.max(0, 5 - full))}</span>;
}

export default function Products() {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
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

  // Expand products into cards: one card per variant (with its own image/price),
  // or a single card for products without variants.
  const cards = [];
  products.forEach((p) => {
    if (p.variants && p.variants.length) {
      p.variants.forEach((v, i) => {
        const price = v.price || p.price;
        cards.push({
          key: `${p._id}__v${i}`, productId: p._id, variantIndex: i,
          name: p.name, sizeLabel: v.label || `${v.quantity} ${v.unit}`.trim(),
          category: p.category, image: v.imageUrl || p.imageUrl,
          price: v.offerPrice && v.offerPrice < price ? v.offerPrice : price,
          originalPrice: price,
          offerPrice: v.offerPrice && v.offerPrice < price ? v.offerPrice : null,
          rating: p.avgRating || p.rating || 0, totalRatings: p.totalRatings || p.reviewCount || 0,
          outOfStock: p.isPaused || p.inStock === false
        });
      });
    } else {
      cards.push({
        key: p._id, productId: p._id, variantIndex: null,
        name: p.name, sizeLabel: p.quantity > 0 ? `${p.quantity} ${p.unit}`.trim() : '',
        category: p.category, image: p.imageUrl,
        price: p.offerPrice && p.offerPrice < p.price ? p.offerPrice : p.price,
        originalPrice: p.price,
        offerPrice: p.offerPrice && p.offerPrice < p.price ? p.offerPrice : null,
        rating: p.avgRating || p.rating || 0, totalRatings: p.totalRatings || p.reviewCount || 0,
        outOfStock: p.isPaused || p.inStock === false
      });
    }
  });
  const filtered = cards.filter((c) => {
    const okCat = cat === 'All' || c.category === cat;
    const s = q.trim().toLowerCase();
    const okSearch = !s || c.name.toLowerCase().includes(s) || (c.sizeLabel || '').toLowerCase().includes(s);
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
              {filtered.map((c) => {
                const to = c.variantIndex != null ? `/product/${c.productId}?v=${c.variantIndex}` : `/product/${c.productId}`;
                const isWished = isInWishlist(c.key);
                return (
                  <div className="shop-card-wrap" key={c.key}>
                    <div className="shop-card">
                      <button
                        type="button"
                        className={`card-wishlist-btn${isWished ? ' active' : ''}`}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(c.key); }}
                        aria-label="Add to wishlist"
                      >
                        {isWished ? '❤️' : '🤍'}
                      </button>
                      <Link to={to} className="card-link">
                        <div className="thumb">
                          {c.offerPrice && <span className="badge-offer">Offer</span>}
                          {c.image ? <img src={c.image} alt={c.name} /> : null}
                          {c.outOfStock && <span className="oos">Out of stock</span>}
                        </div>
                        <div className="body">
                          <span className="cat">{c.category}</span>
                          <h3>{c.name}{c.sizeLabel ? <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}> — {c.sizeLabel}</span> : ''}</h3>
                          <div className="rating"><Stars value={c.rating} /> <span style={{ color: 'var(--ink-faint)' }}>({c.totalRatings})</span></div>
                          <div className="price">
                            {c.offerPrice ? <><s>₹{c.originalPrice}</s>₹{c.offerPrice}</> : <>₹{c.price}</>}
                          </div>
                        </div>
                      </Link>
                      <div className="card-action-bar">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm btn-block"
                          disabled={c.outOfStock}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(c); }}
                        >
                          {c.outOfStock ? 'Out of Stock' : 'Add to Cart 🛒'}
                        </button>
                      </div>
                    </div>
                  </div>
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
