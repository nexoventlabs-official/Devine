import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useCart } from '../context/CartContext';
import { TrustBand } from './Layout';

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/products`);
        const json = await res.json();
        setProducts(json.data || []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Build card objects for all product variants
  const cards = [];
  products.forEach((p) => {
    if (p.variants && p.variants.length) {
      p.variants.forEach((v, i) => {
        const key = `${p._id}__v${i}`;
        if (wishlist.includes(key)) {
          cards.push({
            key,
            productId: p._id,
            variantIndex: i,
            name: p.name,
            sizeLabel: v.label || `${v.quantity} ${v.unit}`.trim(),
            category: p.category,
            image: v.imageUrl || p.imageUrl,
            price: v.offerPrice || v.price || p.price
          });
        }
      });
    } else {
      const key = p._id;
      if (wishlist.includes(key)) {
        cards.push({
          key,
          productId: p._id,
          variantIndex: null,
          name: p.name,
          sizeLabel: p.quantity > 0 ? `${p.quantity} ${p.unit}`.trim() : '',
          category: p.category,
          image: p.imageUrl,
          price: p.offerPrice || p.price
        });
      }
    }
  });

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="crumbs"><Link to="/">Home</Link> / Wishlist</p>
          <h1>My Wishlist ❤️</h1>
          <p>Your saved favorite Devine items.</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          {loading ? (
            <div className="site-loader">Loading wishlist…</div>
          ) : cards.length === 0 ? (
            <div className="empty-note">
              Your wishlist is empty. Browse products and tap the ❤️ icon to save items here!
              <div style={{ marginTop: 16 }}>
                <Link to="/products" className="btn btn-primary">
                  Explore Products
                </Link>
              </div>
            </div>
          ) : (
            <div className="shop-grid">
              {cards.map((c) => (
                <div className="shop-card wishlist-card" key={c.key}>
                  <button
                    className="wishlist-remove-btn"
                    onClick={() => toggleWishlist(c.key)}
                    aria-label="Remove from wishlist"
                  >
                    &times;
                  </button>
                  <div className="thumb">
                    {c.image ? <img src={c.image} alt={c.name} /> : null}
                  </div>
                  <div className="body">
                    <span className="cat">{c.category}</span>
                    <h3>{c.name}{c.sizeLabel ? ` — ${c.sizeLabel}` : ''}</h3>
                    <div className="price">₹{c.price}</div>
                    <button
                      className="btn btn-primary btn-block"
                      style={{ marginTop: 12 }}
                      onClick={() => {
                        addToCart(c);
                        toggleWishlist(c.key);
                      }}
                    >
                      Move to Cart 🛒
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <TrustBand />
    </>
  );
}
