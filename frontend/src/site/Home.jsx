import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { TrustBand, AwardBand } from './Layout';

const BANNERS = ['/site/banners/banner.png', '/site/banners/banner2.png', '/site/banners/banner3.png'];

function BannerSlider() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % BANNERS.length), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="hero">
      <div className="banner-slider">
        {BANNERS.map((b, i) => (
          <div key={b} className={`banner-slide${i === idx ? ' active' : ''}`}>
            <img src={b} alt={`Devine banner ${i + 1}`} />
          </div>
        ))}
      </div>
      <div className="slider-dots">
        {BANNERS.map((b, i) => (
          <button key={b} className={`dot${i === idx ? ' active' : ''}`} aria-label={`Slide ${i + 1}`} onClick={() => setIdx(i)} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        let res = await fetch(`${API_BASE_URL}/products?featured=true`);
        let json = await res.json();
        let list = json.data || [];
        if (!list.length) {
          res = await fetch(`${API_BASE_URL}/products`);
          json = await res.json();
          list = json.data || [];
        }
        if (on) setProducts(list.slice(0, 4));
      } catch { /* leave empty */ }
    })();
    return () => { on = false; };
  }, []);

  return (
    <>
      <BannerSlider />

      <TrustBand />

      <section className="section-pad">
        <div className="container">
          <div className="section-head">
            <h2>Made pure. Kept honest.</h2>
            <p>Everything we bottle starts as a raw, whole ingredient — never a shortcut.</p>
          </div>

          {products.length > 0 ? (
            <div className="product-grid">
              {products.map((p) => {
                const hasOffer = p.offerPrice && p.offerPrice < p.price;
                return (
                  <Link to={`/product/${p._id}`} className="product-card" key={p._id}>
                    <div className="feat-thumb">
                      {hasOffer && <span className="badge-offer">Offer</span>}
                      {p.imageUrl ? <img src={p.imageUrl} alt={p.name} /> : null}
                    </div>
                    <h3>{p.name}</h3>
                    <p className="tag">{p.shortDesc || p.category}</p>
                    <div className="price">
                      {hasOffer ? <><s>₹{p.price}</s>₹{p.offerPrice}</> : <>₹{p.price}</>}
                    </div>
                    <span className="btn btn-outline">Learn More</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="section-head"><p>Our products are being prepared. Check back soon.</p></div>
          )}

          <div className="text-center mt-lg">
            <Link to="/products" className="btn btn-primary">View All Products</Link>
          </div>
        </div>
      </section>

      <section className="section-pad bg-ivory-deep">
        <div className="container">
          <div className="story-split">
            <div>
              <span className="eyebrow">Since 2015</span>
              <h2>Devine is one of India's fastest-growing organic food brands.</h2>
              <p>We started in 2015 with one belief: packaged food shouldn't mean processed food. Every batch is deeply analysed against what our customers actually need — not what's cheapest to produce. That discipline is why Devine has become a trusted name in organic food and beverages across India.</p>
              <Link to="/about" className="btn btn-primary">Our Story</Link>
            </div>
            <div className="story-image">
              <img src="/site/banners/banner.png" alt="Devine story" />
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad-sm">
        <div className="container">
          <div className="stats-row">
            <div className="stat"><b>2015</b><span>Year Founded</span></div>
            <div className="stat"><b>100%</b><span>Natural Sourcing</span></div>
            <div className="stat"><b>2</b><span>Consecutive Awards</span></div>
            <div className="stat"><b>Tamil Nadu</b><span>Proudly Made In</span></div>
          </div>
        </div>
      </section>

      <AwardBand />
    </>
  );
}
