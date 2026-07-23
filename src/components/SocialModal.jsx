import React from 'react';

export default function SocialModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer' }}
        >
          ✕
        </button>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--neon-lime)', marginBottom: '0.5rem' }}>
          #BLITZITUP
        </h3>
        <p style={{ color: '#a0a0a0', marginBottom: '1.5rem' }}>Join the movement. Tag us on Instagram & TikTok to get featured!</p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="btn-pill btn-pill-magenta">
            INSTAGRAM 📸
          </a>
          <a href="https://youtube.com" target="_blank" rel="noreferrer" className="btn-pill btn-pill-outline">
            YOUTUBE 🎬
          </a>
        </div>
      </div>
    </div>
  );
}
