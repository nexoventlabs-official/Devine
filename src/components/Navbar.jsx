import React, { useState } from 'react';

export default function Navbar({ onNavigate, currentPage }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (page) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="nav-left">
        <button onClick={() => handleNavClick('home')} className="brand-logo-wrap btn-link" style={{ position: 'relative', left: '0', transform: 'none', background: 'none', border: 'none', cursor: 'pointer' }}>
          <img src="/assets/logo.svg" alt="Devine Logo" className="brand-logo-img" />
        </button>
      </div>

      {/* Desktop Links */}
      <nav className={`nav-center-links ${isMobileMenuOpen ? 'mobile-nav-active' : ''}`}>
        <button onClick={() => handleNavClick('home')} className={`nav-link-item btn-link ${currentPage === 'home' ? 'active-nav-link' : ''}`}>Home</button>
        <button onClick={() => handleNavClick('products')} className={`nav-link-item btn-link ${currentPage === 'products' ? 'active-nav-link' : ''}`}>Products</button>
        <button onClick={() => handleNavClick('about')} className={`nav-link-item btn-link ${currentPage === 'about' ? 'active-nav-link' : ''}`}>About</button>
        <button onClick={() => handleNavClick('career')} className={`nav-link-item btn-link ${currentPage === 'career' ? 'active-nav-link' : ''}`}>Career</button>
        <button onClick={() => handleNavClick('contact')} className={`nav-link-item btn-link ${currentPage === 'contact' ? 'active-nav-link' : ''}`}>Contact</button>
      </nav>

      <div className="nav-right">
        <button onClick={() => handleNavClick('contact')} className="btn-pill btn-pill-magenta desktop-contact-btn">CONTACT</button>
        
        {/* Mobile Hamburger Toggle Button */}
        <button 
          className="mobile-hamburger-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>
    </header>
  );
}
