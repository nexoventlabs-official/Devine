import React from 'react';

export default function PackShopSection({ onAddToCart }) {
  return (
    <section className="science-section" id="buy-now" style={{ background: 'var(--bg-yellow-light)' }}>
      <div className="section-header">
        <span className="section-tag">DIRECT TO YOUR DOORSTEP</span>
        <h2 className="section-title">ORDER DEVINE GIFT PACKS</h2>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Pack 1 */}
        <div style={{ background: '#ffffff', border: '2px solid var(--brand-green)', borderRadius: '24px', padding: '2rem', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--brand-green-dark)', marginBottom: '0.5rem' }}>SIGNATURE GIFT TRIO</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Honey Amla, Honey Fig & Gulkand</p>
          <img src="/assets/creatives/Honey_Fig.svg" style={{ width: '140px', height: '170px', objectFit: 'contain', borderRadius: '12px', marginBottom: '1.5rem' }} alt="Trio Pack" />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--brand-green)', marginBottom: '1.5rem' }}>₹599</div>
          <button className="btn-pill btn-pill-outline" style={{ width: '100%' }} onClick={() => onAddToCart && onAddToCart('Devine Signature Gift Trio', 599, '/assets/creatives/Honey_Fig.svg', 'trio-3')}>
            ENQUIRE NOW
          </button>
        </div>

        {/* Pack 2 BESTSELLER */}
        <div style={{ background: '#ffffff', border: '3px solid var(--brand-green)', boxShadow: '0 12px 35px rgba(0, 135, 61, 0.25)', borderRadius: '24px', padding: '2rem', textAlign: 'center', position: 'relative' }}>
          <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--brand-green)', color: '#ffffff', fontWeight: '800', fontSize: '0.75rem', padding: '4px 14px', borderRadius: '50px', textTransform: 'uppercase' }}>MOST POPULAR</span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--brand-green-dark)', marginBottom: '0.5rem' }}>HERITAGE ORGANIC BOX</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>All Signature Products + Wooden Spoon</p>
          <img src="/assets/creatives/Honey_Amla.svg" style={{ width: '140px', height: '170px', objectFit: 'contain', borderRadius: '12px', marginBottom: '1.5rem' }} alt="Heritage Box" />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--brand-green)', marginBottom: '1.5rem' }}>₹1,099</div>
          <button className="btn-pill btn-pill-lime" style={{ width: '100%' }} onClick={() => onAddToCart && onAddToCart('Devine Heritage Organic Box', 1099, '/assets/creatives/Honey_Amla.svg', 'sampler-12')}>
            ENQUIRE NOW
          </button>
        </div>

        {/* Pack 3 */}
        <div style={{ background: '#ffffff', border: '2px solid var(--brand-green)', borderRadius: '24px', padding: '2rem', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--brand-green-dark)', marginBottom: '0.5rem' }}>WHOLESALE FAMILY CASE</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Bulk Jars + Free Express Delivery</p>
          <img src="/assets/creatives/Honey_Garlic.svg" style={{ width: '140px', height: '170px', objectFit: 'contain', borderRadius: '12px', marginBottom: '1.5rem' }} alt="Family Case" />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--brand-green)', marginBottom: '1.5rem' }}>₹1,999</div>
          <button className="btn-pill btn-pill-outline" style={{ width: '100%' }} onClick={() => onAddToCart && onAddToCart('Devine Wholesale Family Case', 1999, '/assets/creatives/Honey_Garlic.svg', 'pro-24')}>
            ENQUIRE NOW
          </button>
        </div>

      </div>
    </section>
  );
}
