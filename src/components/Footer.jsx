import React, { useState } from 'react';

export default function Footer({ onOpenSocial, onNavigate, onOpenEnquiry }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Column 1: Brand Info */}
        <div className="footer-brand">
          <button 
            onClick={() => onNavigate && onNavigate('home')} 
            className="brand-logo-wrap btn-link" 
            style={{ position: 'relative', left: '0', transform: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <img src="/assets/logo.svg" alt="Devine Logo" className="brand-logo-img" style={{ height: '48px' }} />
          </button>
          <p>
            Premium quality packaged organic foods & beverages manufactured with real natural ingredients, transparent sourcing, and zero shortcuts. Experience pure nature with Devine!
          </p>
        </div>

        {/* Column 2: Products Links */}
        <div className="footer-col">
          <h4>OUR PRODUCTS</h4>
          <ul>
            <li>
              <button onClick={() => onNavigate && onNavigate('products')} className="footer-link-btn">
                Honey Fig (Honey Anjeer)
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate && onNavigate('products')} className="footer-link-btn">
                Dry Fruits Mix
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate && onNavigate('products')} className="footer-link-btn">
                Pure Rose Gulkand
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate && onNavigate('products')} className="footer-link-btn">
                Browse All Products →
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Company Navigation Links */}
        <div className="footer-col">
          <h4>COMPANY & SUPPORT</h4>
          <ul>
            <li>
              <button onClick={() => onNavigate && onNavigate('about')} className="footer-link-btn">
                About Us & Journey
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate && onNavigate('career')} className="footer-link-btn">
                Careers & Jobs
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate && onNavigate('contact')} className="footer-link-btn">
                Contact & Support
              </button>
            </li>
            <li>
              <button onClick={onOpenSocial} className="footer-link-btn">
                Social Community
              </button>
            </li>
          </ul>
        </div>

        {/* Column 4: Newsletter Subscription */}
        <div className="footer-col">
          <h4>DEVINE NEWSLETTER</h4>
          <p style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600, marginBottom: '1rem', lineHeight: '1.4' }}>
            Subscribe for exclusive organic product launches, healthy recipes & updates.
          </p>
          
          {!subscribed ? (
            <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input 
                type="email" 
                required
                placeholder="Enter your email address..." 
                style={{ padding: '0.65rem 1rem', background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '50px', color: '#fff', flex: 1, minWidth: '180px', fontSize: '0.85rem', fontWeight: 600 }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="btn-pill btn-pill-lime" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
                SUBSCRIBE
              </button>
            </form>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.15)', color: 'var(--bg-yellow)', padding: '0.8rem 1rem', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700 }}>
              ✓ Thank you for subscribing to Devine updates!
            </div>
          )}
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 Devine Natural Foods Pvt. Ltd. All rights reserved.</span>
        <span>Pure Organic Quality & Traditional Craftsmanship</span>
      </div>
    </footer>
  );
}
