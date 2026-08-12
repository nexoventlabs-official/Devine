import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

// Render 5 stars for a given rating (supports half stars).
function Stars({ value = 0, size = 14 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span style={{ color: '#f5a623', fontSize: size, letterSpacing: 1, lineHeight: 1 }}>
      {[0, 1, 2, 3, 4].map((i) => {
        if (i < full) return <span key={i}>★</span>;
        if (i === full && half) return <span key={i}>⯨</span>;
        return <span key={i} style={{ color: '#d6d6d6' }}>★</span>;
      })}
    </span>
  );
}

// Small green rating chip (Flipkart-style) e.g. "4.5 ★"
function RatingChip({ value }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        background: '#388e3c',
        color: '#fff',
        fontSize: 12,
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: 4,
      }}
    >
      {Number(value).toFixed(1)} <span style={{ fontSize: 10 }}>★</span>
    </span>
  );
}

export default function ProductsPage({ onOpenEnquiry, productId, onOpenProduct, onCloseProduct }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Product detail (URL-driven via productId prop)
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/products`);
        const json = await res.json();
        if (!active) return;
        const data = json.data || [];
        setProducts(data);
        const uniqueCats = Array.from(new Set(data.map((p) => p.category).filter(Boolean))).sort();
        setCategories(['All', ...uniqueCats]);
      } catch (err) {
        if (active) setError('Could not load products. Please try again later.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Load the detail whenever the URL productId changes.
  useEffect(() => {
    if (!productId) {
      setDetail(null);
      return;
    }
    let active = true;
    setDetail((prev) => (prev && prev._id === productId ? prev : null));
    setDetailLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/products/${productId}`);
        const json = await res.json();
        if (active && json.success && json.data) setDetail(json.data);
      } catch (err) {
        /* leave detail null; page shows loading→empty */
      } finally {
        if (active) setDetailLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [productId]);

  // Full-page product detail view (replaces the list).
  if (productId) {
    return (
      <ProductDetailPage
        product={detail}
        loading={detailLoading}
        onBack={onCloseProduct}
        onEnquire={() => onOpenEnquiry(detail?.name)}
      />
    );
  }

  const filteredProducts = products.filter((prod) => {
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      prod.name.toLowerCase().includes(q) || (prod.description || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="products-page-container">
      {/* Products Page Banner */}
      <div className="products-page-hero">
        <div className="products-page-hero-inner">
          <span className="products-hero-tag">AUTHENTIC HERITAGE RANGE</span>
          <h1 className="products-hero-title">OUR FULL PRODUCTS COLLECTION</h1>
          <p className="products-hero-desc">
            Explore Devine's 100% natural honeys, herbal infusions, traditional digestives, sun-cooked gulkands, and pure aromatics — crafted without preservatives.
          </p>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="products-filter-toolbar">
        {/* Desktop Category Pills */}
        <div className="category-pills desktop-category-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`cat-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Mobile Category Dropdown Select */}
        <div className="mobile-category-select-wrap">
          <select
            className="mobile-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? `🏷️ All Categories (${products.length} Products)` : `🏷️ Category: ${cat}`}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input Box */}
        <div className="product-search-wrap">
          <span className="search-icon-symbol">🔍</span>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="product-search-input"
          />
        </div>
      </div>

      {/* Products List */}
      <div className="products-list-container">
        {loading ? (
          <div className="no-products-found">
            <h3>Loading products…</h3>
          </div>
        ) : error ? (
          <div className="no-products-found">
            <h3>{error}</h3>
          </div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((prod) => {
            const ratingVal = prod.avgRating || prod.rating || 0;
            const ratingCount = prod.totalRatings || prod.reviewCount || 0;
            return (
              <div
                key={prod._id}
                className="product-row-card"
                onClick={() => onOpenProduct(prod)}
                style={{ cursor: 'pointer' }}
              >
                {/* Product Image Frame */}
                <div className="product-img-frame">
                  <img src={prod.imageUrl} alt={prod.name} className="product-card-img" loading="lazy" />
                </div>

                {/* Product Content Details */}
                <div className="product-card-details">
                  <h3 className="product-card-title">{prod.name}</h3>

                  {/* Rating row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '2px 0 6px' }}>
                    {ratingCount > 0 ? (
                      <>
                        <RatingChip value={ratingVal} />
                        <span style={{ fontSize: 13, color: '#878787' }}>
                          {ratingCount} rating{ratingCount > 1 ? 's' : ''}
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: 13, color: '#878787' }}>No ratings yet</span>
                    )}
                  </div>

                  <p className="product-card-desc">{prod.description}</p>

                  {/* Price */}
                  {prod.price ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
                      <span style={{ fontWeight: 800, fontSize: 18, color: '#1a1a1a' }}>₹{prod.price}</span>
                      {prod.mrp && prod.mrp > prod.price && (
                        <>
                          <span style={{ color: '#878787', textDecoration: 'line-through', fontSize: 14 }}>₹{prod.mrp}</span>
                          <span style={{ color: '#388e3c', fontWeight: 700, fontSize: 13 }}>
                            {Math.round(((prod.mrp - prod.price) / prod.mrp) * 100)}% off
                          </span>
                        </>
                      )}
                    </div>
                  ) : null}

                  {/* Pill Labels */}
                  <div className="product-labels-group">
                    {(prod.badges || []).map((lbl, idx) => (
                      <span key={idx} className="product-pill-label">
                        {lbl}
                      </span>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="product-action-wrap" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      className="enquire-product-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProduct(prod);
                      }}
                      style={{ background: '#fff', color: '#1a7f37', border: '1.5px solid #1a7f37' }}
                    >
                      View Details
                    </button>
                    <button
                      className="enquire-product-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEnquiry(prod.name);
                      }}
                    >
                      Enquire About This Product
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-products-found">
            <h3>No products match your search.</h3>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="btn-pill btn-pill-lime"
            >
              RESET FILTERS
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

function ProductDetailPage({ product, loading, onBack, onEnquire }) {
  const [isNarrow, setIsNarrow] = useState(typeof window !== 'undefined' && window.innerWidth < 820);
  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 820);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // No product yet (fetching after a direct URL load, or not found)
  if (!product) {
    return (
      <div style={ov.page}>
        <div style={ov.inner}>
          <div style={ov.breadcrumb}>
            <button style={ov.backBtn} onClick={onBack}>← Back to Products</button>
          </div>
          <div style={{ padding: 48, textAlign: 'center', color: '#878787' }}>
            {loading ? 'Loading product…' : 'Product not found.'}
          </div>
        </div>
      </div>
    );
  }

  const ratingVal = product.avgRating || product.rating || 0;
  const ratingCount = product.totalRatings || product.reviewCount || 0;
  const dist = product.ratingDistribution || {};
  const reviews = product.reviews || [];
  const discount =
    product.mrp && product.price && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  return (
    <div style={ov.page}>
      <div style={ov.inner}>
        {/* Breadcrumb / back */}
        <div style={ov.breadcrumb}>
          <button style={ov.backBtn} onClick={onBack}>← Back to Products</button>
          <span style={{ color: '#ccc' }}>/</span>
          {product.category && <span style={{ color: '#878787' }}>{product.category}</span>}
          <span style={{ color: '#ccc' }}>/</span>
          <span style={{ color: '#1a1a1a', fontWeight: 600 }}>{product.name}</span>
        </div>

        <div style={{ ...ov.grid, gridTemplateColumns: isNarrow ? '1fr' : 'minmax(0, 420px) 1fr' }}>
          {/* Left: image */}
          <div style={{ ...ov.imgCol, borderRight: isNarrow ? 'none' : '1px solid #f0f0f0', position: isNarrow ? 'static' : 'sticky' }}>
            <div style={ov.imgWrap}>
              <img src={product.imageUrl} alt={product.name} style={ov.img} />
            </div>
            {!isNarrow && (
              <div style={ov.actionsDesktop}>
                <button style={ov.enquireBtn} onClick={onEnquire}>Enquire About This Product</button>
              </div>
            )}
          </div>

          {/* Right: info */}
          <div style={ov.infoCol}>
            {product.category && <div style={ov.category}>{product.category}</div>}
            <h1 style={ov.title}>{product.name}</h1>

            {/* Rating summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 10px' }}>
              {ratingCount > 0 ? (
                <>
                  <RatingChip value={ratingVal} />
                  <span style={{ color: '#878787', fontSize: 14, fontWeight: 600 }}>
                    {ratingCount} rating{ratingCount > 1 ? 's' : ''} &amp; {reviews.filter((r) => r.comment).length} review
                    {reviews.filter((r) => r.comment).length !== 1 ? 's' : ''}
                  </span>
                </>
              ) : (
                <span style={{ color: '#878787', fontSize: 14 }}>No ratings yet — be the first to review</span>
              )}
            </div>

            {/* Price */}
            {product.price ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '8px 0' }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a' }}>₹{product.price}</span>
                {product.mrp && product.mrp > product.price && (
                  <>
                    <span style={{ color: '#878787', textDecoration: 'line-through', fontSize: 16 }}>₹{product.mrp}</span>
                    <span style={{ color: '#388e3c', fontWeight: 700, fontSize: 15 }}>{discount}% off</span>
                  </>
                )}
              </div>
            ) : null}

            {/* Badges */}
            {(product.badges || []).length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0' }}>
                {product.badges.map((b, i) => (
                  <span key={i} style={ov.badge}>{b}</span>
                ))}
              </div>
            )}

            {/* Description */}
            {(product.description || product.shortDesc) && (
              <div style={{ margin: '12px 0' }}>
                <div style={ov.sectionLabel}>Product Description</div>
                <p style={{ color: '#333', lineHeight: 1.6, fontSize: 14, margin: 0 }}>
                  {product.description || product.shortDesc}
                </p>
              </div>
            )}

            {/* Ratings & Reviews (Flipkart-style) */}
            <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16 }}>
              <div style={ov.sectionLabel}>Ratings &amp; Reviews</div>

              {loading ? (
                <p style={{ color: '#878787', fontSize: 14 }}>Loading reviews…</p>
              ) : ratingCount > 0 ? (
                <>
                  <div style={ov.ratingSummary}>
                    <div style={ov.avgBox}>
                      <div style={{ fontSize: 34, fontWeight: 800, color: '#1a1a1a', lineHeight: 1 }}>
                        {Number(ratingVal).toFixed(1)}
                      </div>
                      <Stars value={ratingVal} size={16} />
                      <div style={{ color: '#878787', fontSize: 12, marginTop: 4 }}>
                        {ratingCount} rating{ratingCount > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      {[5, 4, 3, 2, 1].map((star) => {
                        const c = dist[star] || 0;
                        const pct = ratingCount ? (c / ratingCount) * 100 : 0;
                        return (
                          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: '#555', width: 34 }}>{star} ★</span>
                            <div style={ov.barTrack}>
                              <div style={{ ...ov.barFill, width: `${pct}%`, background: star >= 3 ? '#388e3c' : '#ff9f00' }} />
                            </div>
                            <span style={{ fontSize: 12, color: '#878787', width: 28, textAlign: 'right' }}>{c}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Individual reviews */}
                  <div style={{ marginTop: 14 }}>
                    {reviews.length === 0 && (
                      <p style={{ color: '#878787', fontSize: 14 }}>No written reviews yet.</p>
                    )}
                    {reviews.map((r, i) => (
                      <div key={i} style={ov.review}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={ov.reviewStar}>{Number(r.rating).toFixed(1)} ★</span>
                          <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>{r.reviewer}</span>
                          {r.date && (
                            <span style={{ color: '#aaa', fontSize: 12, marginLeft: 'auto' }}>
                              {new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        {r.comment && <p style={{ margin: 0, color: '#333', fontSize: 14, lineHeight: 1.5 }}>{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ color: '#878787', fontSize: 14 }}>No ratings yet — be the first to review this product.</p>
              )}
            </div>

            {/* Mobile action */}
            {isNarrow && (
              <div style={ov.actionsMobile}>
                <button style={ov.enquireBtn} onClick={onEnquire}>Enquire About This Product</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ov = {
  page: { background: '#f6f6f6', minHeight: '70vh', padding: '20px 16px 60px' },
  inner: {
    background: '#fff', borderRadius: 14, width: 'min(1100px, 100%)', margin: '0 auto',
    boxShadow: '0 2px 14px rgba(0,0,0,.06)', overflow: 'hidden',
  },
  breadcrumb: {
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
    padding: '14px 24px', borderBottom: '1px solid #f0f0f0', fontSize: 13,
  },
  backBtn: {
    background: 'transparent', border: 'none', color: '#1a7f37', fontWeight: 700,
    fontSize: 14, cursor: 'pointer', padding: 0,
  },
  grid: { display: 'grid', gridTemplateColumns: 'minmax(0, 420px) 1fr', gap: 0 },
  imgCol: { padding: 24, borderRight: '1px solid #f0f0f0', position: 'sticky', top: 0, alignSelf: 'start' },
  imgWrap: {
    width: '100%', aspectRatio: '1/1', background: '#faf7f2', borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  actionsDesktop: { marginTop: 16 },
  infoCol: { padding: 24 },
  category: { color: '#1a7f37', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { margin: '4px 0', fontSize: 26, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.25 },
  badge: { background: '#eef7ee', color: '#1a7f37', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20 },
  sectionLabel: { fontSize: 13, fontWeight: 700, color: '#878787', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  ratingSummary: { display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' },
  avgBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minWidth: 90, paddingRight: 20, borderRight: '1px solid #eee',
  },
  barTrack: { flex: 1, height: 7, background: '#eee', borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6 },
  review: { borderTop: '1px solid #f2f2f2', padding: '12px 0' },
  reviewStar: {
    background: '#388e3c', color: '#fff', fontSize: 12, fontWeight: 700,
    padding: '1px 6px', borderRadius: 4,
  },
  enquireBtn: {
    width: '100%', background: '#1a7f37', color: '#fff', border: 'none', borderRadius: 8,
    padding: '12px 18px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  actionsMobile: { marginTop: 18 },
};
