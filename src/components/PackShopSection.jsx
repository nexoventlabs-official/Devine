import React from 'react';

export default function PackShopSection({ onAddToCart }) {
  return (
    <section className="science-section" id="buy-now" style={{ background: 'var(--bg-yellow-light)' }}>
      <div className="section-header">
        <span className="section-tag">DIRECT TO YOUR DOORSTEP</span>
        <h2 className="section-title">ORDER BLITZ PACKS</h2>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Pack 1 */}
        <div style={{ background: '#ffffff', border: '2px solid var(--brand-green)', borderRadius: '24px', padding: '2rem', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--brand-green-dark)', marginBottom: '0.5rem' }}>6-PACK STARTER CASE</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Pick your favorite flavor</p>
          <img src="/assets/blitz_raspberry_lemonade.jpg" style={{ width: '140px', height: '170px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--brand-green)' }} alt="6-pack" />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--brand-green)', marginBottom: '1.5rem' }}>₹599</div>
          <button className="btn-pill btn-pill-outline" style={{ width: '100%' }} onClick={() => onAddToCart('Blitz 6-Pack Starter Case', 599, '/assets/blitz_raspberry_lemonade.jpg', 'pack-6')}>
            ADD TO CART
          </button>
        </div>

        {/* Pack 2 BESTSELLER */}
        <div style={{ background: '#ffffff', border: '3px solid var(--brand-green)', boxShadow: '0 12px 35px rgba(0, 135, 61, 0.25)', borderRadius: '24px', padding: '2rem', textAlign: 'center', position: 'relative' }}>
          <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--brand-green)', color: '#ffffff', fontWeight: '800', fontSize: '0.75rem', padding: '4px 14px', borderRadius: '50px', textTransform: 'uppercase' }}>MOST POPULAR</span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--brand-green-dark)', marginBottom: '0.5rem' }}>12-PACK SAMPLER BOX</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>All 3 Flavors + Free Blitz Sticker Pack</p>
          <img src="/assets/blitz_mango_rush.jpg" style={{ width: '140px', height: '170px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--brand-green)' }} alt="12-pack" />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--brand-green)', marginBottom: '1.5rem' }}>₹1,099</div>
          <button className="btn-pill btn-pill-lime" style={{ width: '100%' }} onClick={() => onAddToCart('Blitz 12-Pack Sampler Box', 1099, '/assets/blitz_mango_rush.jpg', 'sampler-12')}>
            ADD TO CART
          </button>
        </div>

        {/* Pack 3 */}
        <div style={{ background: '#ffffff', border: '2px solid var(--brand-green)', borderRadius: '24px', padding: '2rem', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--brand-green-dark)', marginBottom: '0.5rem' }}>24-PACK PRO CASE</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Bulk Energy + Free Shipping & Shaker</p>
          <img src="/assets/blitz_electric_citrus.jpg" style={{ width: '140px', height: '170px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--brand-green)' }} alt="24-pack" />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--brand-green)', marginBottom: '1.5rem' }}>₹1,999</div>
          <button className="btn-pill btn-pill-outline" style={{ width: '100%' }} onClick={() => onAddToCart('Blitz 24-Pack Pro Case', 1999, '/assets/blitz_electric_citrus.jpg', 'pro-24')}>
            ADD TO CART
          </button>
        </div>

      </div>
    </section>
  );
}
