import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export default function ProductsPage({ onOpenEnquiry, onNavigateHome }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          filteredProducts.map((prod) => (
            <div key={prod._id} className="product-row-card">
              {/* Product Image Frame */}
              <div className="product-img-frame">
                <img src={prod.imageUrl} alt={prod.name} className="product-card-img" loading="lazy" />
              </div>

              {/* Product Content Details */}
              <div className="product-card-details">
                <h3 className="product-card-title">{prod.name}</h3>
                <p className="product-card-desc">{prod.description}</p>

                {/* Pill Labels */}
                <div className="product-labels-group">
                  {(prod.badges || []).map((lbl, idx) => (
                    <span key={idx} className="product-pill-label">
                      {lbl}
                    </span>
                  ))}
                </div>

                {/* Enquire Button */}
                <div className="product-action-wrap">
                  <button className="enquire-product-btn" onClick={() => onOpenEnquiry(prod.name)}>
                    Enquire About This Product
                  </button>
                </div>
              </div>
            </div>
          ))
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
