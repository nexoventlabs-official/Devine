import React from 'react';

export default function ScienceSection() {
  return (
    <section className="science-section" id="science">
      <div className="section-header">
        <span className="section-tag">FORMULATION BREAKDOWN</span>
        <h2 className="section-title">THE DEVINE PURITY GUARANTEE</h2>
      </div>

      <div className="science-grid">
        <div className="comparison-card card-blitz">
          <div className="card-header-tag" style={{ color: 'var(--brand-green-dark)' }}>
            <span>🌿 DEVINE 100% NATURAL FORMULATION</span>
          </div>
          <ul className="benefit-list">
            <li className="benefit-item">
              <div className="benefit-icon check">✓</div>
              <div className="benefit-text">
                <h4>Unprocessed Raw Forest Honey</h4>
                <p>Harvested directly from pristine mountain hives, retaining active natural enzymes, wild pollen, and medicinal antioxidants.</p>
              </div>
            </li>
            <li className="benefit-item">
              <div className="benefit-icon check">✓</div>
              <div className="benefit-text">
                <h4>Sun-Cooked Rose & Botanical Infusions</h4>
                <p>Crafted using age-old slow cooking techniques with Damask rose, Amla, cashews, almonds, and aromatic spices.</p>
              </div>
            </li>
            <li className="benefit-item">
              <div className="benefit-icon check">✓</div>
              <div className="benefit-text">
                <h4>Zero Preservatives & Single-Serve Tins</h4>
                <p>Hygienically sealed in fresh single-serve tins to lock in natural aroma, cooling digestives, and traditional flavor.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="comparison-card card-others">
          <div className="card-header-tag" style={{ color: '#666' }}>
            <span>🚫 MASS-PRODUCED COMMERCIAL ALTERNATIVES</span>
          </div>
          <ul className="benefit-list">
            <li className="benefit-item">
              <div className="benefit-icon cross">✕</div>
              <div className="benefit-text">
                <h4>High Refined Sugars & Glucose Syrups</h4>
                <p>Diluted with cheap corn syrups and refined sugars that trigger sharp blood sugar spikes and acidity.</p>
              </div>
            </li>
            <li className="benefit-item">
              <div className="benefit-icon cross">✕</div>
              <div className="benefit-text">
                <h4>Chemical Preservatives & Synthetic Dyes</h4>
                <p>Contains sodium benzoate, artificial food colors, and synthetic fragrances that ruin natural health benefits.</p>
              </div>
            </li>
            <li className="benefit-item">
              <div className="benefit-icon cross">✕</div>
              <div className="benefit-text">
                <h4>High-Heat Ultra Pasteurization</h4>
                <p>Boiled at ultra-high temperatures which destroys fragile honey enzymes, natural Vitamin C, and floral aromas.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
