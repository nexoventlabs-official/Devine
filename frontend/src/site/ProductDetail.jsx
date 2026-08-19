import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { WA_LINK } from './Layout';

function Stars({ value = 0 }) {
  const full = Math.round(value);
  return <span>{'★'.repeat(full)}{'☆'.repeat(Math.max(0, 5 - full))}</span>;
}

export default function ProductDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [variantIdx, setVariantIdx] = useState(-1); // -1 = base product
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    let on = true;
    setLoading(true); setNotFound(false); setVariantIdx(-1); setImgIdx(0);
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/products/${id}`);
        const json = await res.json();
        if (!on) return;
        if (json.success && json.data) setProduct(json.data);
        else setNotFound(true);
      } catch { if (on) setNotFound(true); } finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, [id]);

  // Media shown in the gallery. When a size/variant is selected, show ONLY that
  // variant's images (main + its extra images); otherwise show the product's own
  // images. The product video (if any) always appears at the end.
  const media = useMemo(() => {
    if (!product) return [];
    const out = [];
    const pushImg = (u) => { if (u && !out.some((m) => m.url === u)) out.push({ type: 'image', url: u }); };
    const vsel = variantIdx >= 0 ? (product.variants || [])[variantIdx] : null;
    if (vsel) {
      pushImg(vsel.imageUrl);
      (vsel.images || []).forEach(pushImg);
      if (!out.length) pushImg(product.imageUrl); // fallback if the variant has no image
    } else {
      // Cover is the hero banner (not a product photo), so it's excluded here.
      pushImg(product.imageUrl);
      (product.gallery || []).forEach(pushImg);
    }
    if (product.videoUrl) out.push({ type: 'video', url: product.videoUrl });
    return out;
  }, [product, variantIdx]);

  // Preselect a variant when arriving from a variant card (?v=index); else default
  // to the first variant when the product has variants.
  useEffect(() => {
    if (!product) return;
    const v = params.get('v');
    const i = v != null ? Number(v) : 0;
    if (product.variants && product.variants.length) {
      setVariantIdx(product.variants[i] ? i : 0);
      setImgIdx(0);
    }
  }, [product, params]);

  if (loading) return <div className="devine-site-detail"><div className="site-loader">Loading…</div></div>;
  if (notFound || !product) {
    return (
      <section className="section-pad">
        <div className="container empty-note">
          Product not found. <Link to="/products" style={{ color: 'var(--amber-deep)', fontWeight: 600 }}>Back to products</Link>
        </div>
      </section>
    );
  }

  const v = variantIdx >= 0 ? product.variants[variantIdx] : null;
  const basePrice = v ? (v.price || product.price) : product.price;
  const offerPrice = v ? v.offerPrice : product.offerPrice;
  const hasOffer = offerPrice && offerPrice < basePrice;
  const rating = product.avgRating || product.rating || 0;
  const dist = product.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const total = product.totalRatings || product.reviewCount || 0;
  const enquireLink = `/contact?product=${encodeURIComponent(product.name)}`;

  return (
    <>
      <section
        className="page-hero"
        style={{
          padding: '64px 0 72px',
          ...(product.coverImageUrl
            ? { background: `linear-gradient(180deg, rgba(35,48,28,0.72), rgba(35,48,28,0.55)), url(${product.coverImageUrl}) center/cover no-repeat` }
            : {})
        }}
      >
        <div className="container">
          <p className="crumbs"><Link to="/">Home</Link> / <Link to="/products">Products</Link> / {product.name}</p>
          <h1>{product.name}</h1>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="pd-grid">
            {/* Gallery */}
            <div className="pd-gallery">
              {(() => {
                const active = media[imgIdx] || media[0];
                if (!active) return <img className="pd-main-img" src={product.imageUrl} alt={product.name} />;
                return active.type === 'video'
                  ? <video className="pd-main-img" src={active.url} controls playsInline poster={product.coverImageUrl || product.imageUrl} style={{ background: '#000' }} />
                  : <img className="pd-main-img" src={active.url} alt={product.name} />;
              })()}
              {media.length > 1 && (
                <div className="pd-thumbs">
                  {media.map((m, i) => (
                    <div key={i} onClick={() => setImgIdx(i)} className={`pd-thumb${i === imgIdx ? ' active' : ''}`} style={{ position: 'relative' }}>
                      {m.type === 'video'
                        ? <><video src={m.url} muted /><span className="pd-thumb-play">▶</span></>
                        : <img src={m.url} alt="" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <span className="pd-cat">{product.category}</span>
              <h2 className="pd-title">{product.name}</h2>
              <div className="pd-rating"><Stars value={rating} /> {rating ? rating.toFixed(1) : '—'} <span className="count">({total} rating{total === 1 ? '' : 's'})</span></div>

              <div className="pd-price">
                {hasOffer ? <><s>₹{basePrice}</s>₹{offerPrice}{product.offerTitle ? <span className="off">{product.offerTitle}</span> : null}</> : <>₹{basePrice}</>}
              </div>
              {product.deliveryCharge > 0 ? <div style={{ color: 'var(--ink-faint)', fontSize: '0.88rem' }}>+ ₹{product.deliveryCharge} delivery</div> : <div style={{ color: 'var(--olive-deep)', fontSize: '0.88rem', fontWeight: 600 }}>Free delivery</div>}
              {product.quantity > 0 && !(product.variants && product.variants.length) && (
                <div style={{ color: 'var(--ink-soft)', fontSize: '0.95rem', marginTop: 8 }}>Pack size: <b>{product.quantity} {product.unit}</b></div>
              )}

              {product.description || product.shortDesc ? <p className="pd-desc">{product.description || product.shortDesc}</p> : null}

              {product.variants?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-soft)' }}>Select size</div>
                  <div className="pd-variants">
                    {product.variants.map((vr, i) => (
                      <button key={i} className={`pd-variant${variantIdx === i ? ' active' : ''}`} onClick={() => { setVariantIdx(i); setImgIdx(0); }}>
                        {(vr.imageUrl || product.imageUrl) && <img className="pd-variant-img" src={vr.imageUrl || product.imageUrl} alt="" />}
                        <b>{vr.label || `${vr.quantity} ${vr.unit}`}</b>
                        <span>₹{vr.offerPrice && vr.offerPrice < (vr.price || product.price) ? vr.offerPrice : (vr.price || product.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pd-actions">
                <a href={WA_LINK} target="_blank" rel="noreferrer" className="btn btn-primary">Order on WhatsApp</a>
                <Link to={enquireLink} className="btn btn-outline">Enquire About This Product</Link>
              </div>

              {product.badges?.length > 0 && (
                <div className="pd-badges">
                  {product.badges.map((b, i) => <span className="pill" key={i}>{b}</span>)}
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div className="reviews-wrap">
            <div className="section-head align-left"><h2>Ratings &amp; Reviews</h2></div>
            <div className="reviews-summary">
              <div className="rs-score">
                <div className="big">{rating ? rating.toFixed(1) : '0.0'}</div>
                <div className="stars"><Stars value={rating} /></div>
                <div className="count">{total} rating{total === 1 ? '' : 's'}</div>
              </div>
              <div className="rs-bars">
                {[5, 4, 3, 2, 1].map((star) => {
                  const c = dist[star] || 0;
                  const pct = total ? Math.round((c / total) * 100) : 0;
                  return (
                    <div className="rs-bar" key={star}>
                      <span>{star}★</span>
                      <div className="track"><div className="fill" style={{ width: `${pct}%` }} /></div>
                      <span style={{ minWidth: 34, textAlign: 'right' }}>{c}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {product.reviews?.length > 0 ? (
              <div className="review-list">
                {product.reviews.map((r, i) => (
                  <div className="review-item" key={i}>
                    <div className="head">
                      <span className="who">{r.reviewer}</span>
                      <span className="date">{r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                    </div>
                    <div className="stars"><Stars value={r.rating} /></div>
                    {r.comment ? <p style={{ marginTop: 6 }}>{r.comment}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-note">No reviews yet. Reviews are collected from verified WhatsApp orders after delivery.</div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
