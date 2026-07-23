import React, { useRef, useState } from 'react';

export default function HeroSection() {
  const cardRef = useRef(null);
  const [tiltStyle, setTiltStyle] = useState({ transform: 'rotate(-4deg)' });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.parentElement.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotateX = (-y / rect.height) * 12;
    const rotateY = (x / rect.width) * 12;

    setTiltStyle({
      transform: `rotate(-4deg) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({ transform: 'rotate(-4deg)' });
  };

  return (
    <section className="hero-section" id="hero">
      {/* TOP TORN PAPER SVG BACKGROUND FROM ASSETS */}
      <div className="hero-top-svg-wrap">
        <img src="/assets/hero_top.svg" alt="Hero Top Graphic" className="hero-top-svg-img" />
      </div>

      <div className="hero-container">
        <div className="hero-content">
          <div className="pure-naturally-yours-wrap">
            <span className="hero-tag-pure">Pure</span>
            <h1 className="hero-title-naturally">Naturally</h1>
            <div className="hero-sub-yours">
              Yours <span className="leaf-icon">🍃</span>
            </div>
          </div>

          <div className="hero-ribbon-banner">
            <span>100% NATURAL</span> • <span>PREMIUM QUALITY</span>
          </div>

          <div className="hero-nature-tagline">
            <span className="line-divider"></span>
            <span className="tagline-text">GOODNESS FROM NATURE</span>
            <span className="line-divider"></span>
          </div>

          <div className="hero-actions" style={{ marginTop: '1.4rem' }}>
            <a href="#story" className="btn-pill btn-pill-lime" style={{ padding: '0.85rem 2.4rem', fontSize: '1rem' }}>
              OUR STORY
            </a>
          </div>
        </div>

        {/* Hero Bottle Container Crossing Over Torn Paper Divider */}
        <div className="hero-bottle-wrap" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          <div className="bottle-img-card" ref={cardRef} style={tiltStyle}>
            <img src="/assets/hero.svg" alt="Blitz Energy Drink Showcase" />
          </div>
        </div>
      </div>
    </section>
  );
}
