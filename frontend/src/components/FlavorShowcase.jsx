import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export default function FlavorShowcase({ onNavigateProducts }) {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/products?featured=true`);
        const json = await res.json();
        if (!active) return;
        let data = json.data || [];
        // Fallback: if none marked featured, show first 3 products.
        if (data.length === 0) {
          const all = await (await fetch(`${API_BASE_URL}/products`)).json();
          data = (all.data || []).slice(0, 3);
        }
        setFeatured(data.slice(0, 3));
      } catch {
        setFeatured([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (featured.length === 0) return null;

  return (
    <section className="flavor-section featured-showcase-section" id="products">
      <div className="section-header">
        <span className="section-tag">HERITAGE & PURITY</span>
        <h2 className="section-title">FEATURED PRODUCT RANGE</h2>
      </div>

      <div className="featured-grid-container">
        {featured.map((prod, idx) => (
          <div
            key={prod._id}
            className={`featured-card card-${prod.retailerId || prod._id} ${idx === 1 ? 'default-active' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => onNavigateProducts && onNavigateProducts()}
          >
            {/* Inner Background Clip Layer */}
            <div className="card-bg-clip">
              {prod.waveImageUrl && (
                <div className="card-wave-bg">
                  <img src={prod.waveImageUrl} alt="" className="wave-svg-img" />
                </div>
              )}
            </div>

            {/* Top Product Image Popping Out */}
            <div className="card-popout-wrap">
              <img src={prod.imageUrl} alt={prod.name} className="card-popout-img" loading="lazy" />
            </div>

            {/* Card Content */}
            <div className="card-body-content">
              <h3 className="featured-card-title">{prod.name}</h3>
              <p className="featured-card-desc">{prod.shortDesc || prod.description}</p>

              {/* Action Button */}
              <div className="featured-card-controls">
                <button
                  className="featured-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigateProducts) onNavigateProducts();
                  }}
                >
                  VIEW PRODUCT DETAILS →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
