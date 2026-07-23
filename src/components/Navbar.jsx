import React from 'react';

export default function Navbar({ onNavigate, currentPage }) {
  return (
    <header className="navbar">
      <div className="nav-left">
        <button onClick={() => onNavigate('home')} className="brand-logo-wrap btn-link" style={{ position: 'relative', left: '0', transform: 'none', background: 'none', border: 'none', cursor: 'pointer' }}>
          <img src="/assets/logo.svg" alt="Devine Logo" className="brand-logo-img" />
        </button>
      </div>

      <nav className="nav-center-links">
        <button onClick={() => onNavigate('home')} className={`nav-link-item btn-link ${currentPage === 'home' ? 'active-nav-link' : ''}`}>Home</button>
        <button onClick={() => onNavigate('products')} className={`nav-link-item btn-link ${currentPage === 'products' ? 'active-nav-link' : ''}`}>Products</button>
        <button onClick={() => onNavigate('about')} className={`nav-link-item btn-link ${currentPage === 'about' ? 'active-nav-link' : ''}`}>About</button>
        <button onClick={() => onNavigate('career')} className={`nav-link-item btn-link ${currentPage === 'career' ? 'active-nav-link' : ''}`}>Career</button>
        <button onClick={() => onNavigate('contact')} className={`nav-link-item btn-link ${currentPage === 'contact' ? 'active-nav-link' : ''}`}>Contact</button>
      </nav>

      <div className="nav-right">
        <button onClick={() => onNavigate('contact')} className="btn-pill btn-pill-magenta">CONTACT</button>
      </div>
    </header>
  );
}
