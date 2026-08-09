import React from 'react';

const featuredProducts = [
  {
    id: "honey-amla",
    name: "Honey Amla",
    desc: "Fresh organic Amla slow-steeped in pure wild mountain honey. A classic Ayurvedic daily immunity booster loaded with Vitamin C.",
    img: "/assets/creatives/Honey_Amla.svg",
    waveImg: "/assets/creatives/Honey_Amla_wave.svg"
  },
  {
    id: "honey-fig",
    name: "Honey Fig",
    desc: "Sun-dried Turkish figs soaked in rich raw forest honey. High in natural dietary fiber, iron, and essential minerals for daily vitality.",
    img: "/assets/creatives/Honey_Fig.svg",
    waveImg: "/assets/creatives/Honey_Fig_wave.svg"
  },
  {
    id: "honey-garlic",
    name: "Honey Garlic",
    desc: "Aged mountain garlic cloves fermented in pure raw honey. A potent traditional remedy for heart health and natural immunity.",
    img: "/assets/creatives/Honey_Garlic.svg",
    waveImg: "/assets/creatives/Honey_Garlic_wave.svg"
  }
];

export default function FlavorShowcase({ onNavigateProducts }) {
  return (
    <section className="flavor-section featured-showcase-section" id="products">
      <div className="section-header">
        <span className="section-tag">HERITAGE & PURITY</span>
        <h2 className="section-title">FEATURED PRODUCT RANGE</h2>
      </div>

      <div className="featured-grid-container">
        {featuredProducts.map((prod) => (
          <div 
            key={prod.id} 
            className={`featured-card card-${prod.id} ${prod.id === 'honey-fig' ? 'default-active' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => onNavigateProducts && onNavigateProducts()}
          >
            {/* Inner Background Clip Layer */}
            <div className="card-bg-clip">
              {prod.waveImg && (
                <div className="card-wave-bg">
                  <img src={prod.waveImg} alt="" className="wave-svg-img" />
                </div>
              )}
            </div>

            {/* Top Product SVG Popping Out */}
            <div className="card-popout-wrap">
              <img 
                src={prod.img} 
                alt={prod.name} 
                className="card-popout-img" 
              />
            </div>

            {/* Card Content */}
            <div className="card-body-content">
              <h3 className="featured-card-title">{prod.name}</h3>
              <p className="featured-card-desc">{prod.desc}</p>

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
