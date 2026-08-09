import React, { useState } from 'react';

const allProducts = [
  {
    id: "gulganth-dry-fruits",
    name: "Gulganth Dry Fruits",
    category: "Gulkand & Dry Fruits",
    desc: "Exquisite sun-cooked Damask rose petals generously blended with premium cashew nuts, almonds, and pistachios for a royal, invigorating after-meal bite.",
    labels: ["Royal formulation", "Rich in dry fruits", "100% Natural"],
    img: "/assets/creatives/Gulganth_Dry_Fruits.svg",
    price: 699
  },
  {
    id: "honey-amla",
    name: "Honey Amla",
    category: "Honey & Infusions",
    desc: "Fresh organic Indian gooseberries (Amla) slow-steeped in pure wild mountain honey. A classic Ayurvedic daily immunity booster loaded with Vitamin C.",
    labels: ["Ayurvedic recipe", "Immunity booster", "100% Natural"],
    img: "/assets/creatives/Honey_Amla.svg",
    price: 649
  },
  {
    id: "honey-fig",
    name: "Honey Fig",
    category: "Honey & Infusions",
    desc: "Sun-dried Turkish figs soaked in rich raw forest honey. High in natural dietary fiber, iron, and essential minerals for daily vitality.",
    labels: ["Rich in fiber", "Raw forest honey", "No added sugar"],
    img: "/assets/creatives/Honey_Fig.svg",
    price: 699
  },
  {
    id: "honey-garlic",
    name: "Honey Garlic",
    category: "Honey & Infusions",
    desc: "Aged mountain garlic cloves fermented in pure raw honey. A potent traditional remedy known for cardiovascular wellness and natural immunity.",
    labels: ["Aged fermentation", "Heart health", "Traditional remedy"],
    img: "/assets/creatives/Honey_Garlic.svg",
    price: 599
  },
  {
    id: "honey-mappillai-mix",
    name: "Honey Mappillai Mix",
    category: "Honey & Infusions",
    desc: "A heritage South Indian herbal honey blend infused with traditional invigorating herbs, nuts, and botanical extracts for sustained stamina.",
    labels: ["Heritage blend", "Herbal tonic", "Energy booster"],
    img: "/assets/creatives/Honey_Mappillai_Mix.svg",
    price: 799
  },
  {
    id: "gulkand-rose-jam",
    name: "Gulkand Rose Petal Jam",
    category: "Gulkand & Dry Fruits",
    desc: "Authentic sun-cured Damask rose petal preserve prepared using age-old slow cooking techniques. Naturally cooling for digestive health.",
    labels: ["Sun-cured roses", "Natural cooling", "Pure recipe"],
    img: "/assets/creatives/Gulkand_Rose_Petal_Jam.svg",
    price: 499
  },
  {
    id: "narumanam-mouth-freshener",
    name: "Narumanam Mouth Freshener",
    category: "Digestives & Beeda",
    desc: "A fragrant blend of roasted fennel seeds, silver-coated cardamom, dry dates, and herbal cooling seeds for long-lasting fresh breath.",
    labels: ["Fresh breath", "Herbal blend", "After-meal digestive"],
    img: "/assets/creatives/Narumanam_Mouth_Freshener.svg",
    price: 399
  },
  {
    id: "narumanam-agarbatti",
    name: "Narumanam Agarbatti",
    category: "Aromatics & Sambrani",
    desc: "Hand-rolled sacred incense sticks crafted with natural flower resins, sandalwood oils, and pure botanical extracts for peaceful meditation.",
    labels: ["Hand-rolled", "Natural resins", "Long-burning"],
    img: "/assets/creatives/Narumanam_Agrabatti.svg",
    price: 249
  },
  {
    id: "narumanam-cup-sambrani",
    name: "Narumanam Cup Sambrani",
    category: "Aromatics & Sambrani",
    desc: "Traditional charcoal-free sambrani cups filled with pure benzoin resin (Loban). Emits a soothing, purifying herbal smoke for homes and temples.",
    labels: ["Pure Loban resin", "Charcoal-free", "Purifying fragrance"],
    img: "/assets/creatives/Narumanam_Cup_sambrani.svg",
    price: 299
  }
];

export default function ProductsPage({ onOpenEnquiry, onNavigateHome }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Honey & Infusions', 'Digestives & Beeda', 'Gulkand & Dry Fruits', 'Aromatics & Sambrani'];

  const filteredProducts = allProducts.filter((prod) => {
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.desc.toLowerCase().includes(searchQuery.toLowerCase());
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
                {cat === 'All' ? '🏷️ All Categories (9 Products)' : `🏷️ Category: ${cat}`}
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

      {/* Products List matching clean layout without background frame */}
      <div className="products-list-container">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((prod) => (
            <div key={prod.id} className="product-row-card">
              {/* Product Image Frame (Clean without background design) */}
              <div className="product-img-frame">
                <img src={prod.img} alt={prod.name} className="product-card-img" />
              </div>

              {/* Product Content Details */}
              <div className="product-card-details">
                <h3 className="product-card-title">{prod.name}</h3>
                <p className="product-card-desc">{prod.desc}</p>

                {/* 3 Pill Labels */}
                <div className="product-labels-group">
                  {prod.labels.map((lbl, idx) => (
                    <span key={idx} className="product-pill-label">
                      {lbl}
                    </span>
                  ))}
                </div>

                {/* Enquire Button */}
                <div className="product-action-wrap">
                  <button 
                    className="enquire-product-btn"
                    onClick={() => onOpenEnquiry(prod.name)}
                  >
                    Enquire About This Product
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-products-found">
            <h3>No products match your search.</h3>
            <button onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }} className="btn-pill btn-pill-lime">
              RESET FILTERS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
