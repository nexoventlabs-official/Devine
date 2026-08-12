import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

// Home-page category strip: category tiles (image + name) scrolling in a marquee.
// Clicking a tile opens the Products page filtered to that category.
export default function CategoryMarquee({ onSelectCategory }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/catalog/categories`);
        const json = await res.json();
        if (!active) return;
        setCategories((json.data || []).filter((c) => c.imageUrl));
      } catch {
        if (active) setCategories([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (categories.length === 0) return null;

  // Duplicate the list so the marquee loops seamlessly.
  const loop = [...categories, ...categories];

  return (
    <section className="category-marquee-section" id="categories">
      <div className="section-header">
        <span className="section-tag">EXPLORE THE RANGE</span>
        <h2 className="section-title">SHOP BY CATEGORY</h2>
      </div>

      <div className="cat-marquee-viewport">
        <div className="cat-marquee-track">
          {loop.map((c, i) => (
            <button
              key={`${c._id}-${i}`}
              className="cat-marquee-item"
              onClick={() => onSelectCategory && onSelectCategory(c.name)}
              aria-label={c.name}
            >
              <span className="cat-marquee-img-wrap">
                <img src={c.imageUrl} alt={c.name} className="cat-marquee-img" loading="lazy" />
              </span>
              <span className="cat-marquee-name">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
