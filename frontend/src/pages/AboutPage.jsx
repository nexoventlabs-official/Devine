import React from 'react';

export default function AboutPage({ onNavigateProducts }) {
  const milestones = [
    {
      year: "2015",
      title: "The Beginning",
      desc: "Devine is founded in Tamil Nadu with a mission to bring genuinely natural, organic food products to Indian households."
    },
    {
      year: "2016",
      title: "Best Food Products Manufacturer",
      desc: "Devine is recognised as the Best Food Products Manufacturer in Tamil Nadu for the first time."
    },
    {
      year: "2017",
      title: "Award Retained",
      desc: "Devine wins the award for a second consecutive year, cementing a reputation for consistent quality."
    },
    {
      year: "Today",
      title: "A Growing Family",
      desc: "Four signature product lines, a growing distribution network, and a customer base that keeps coming back."
    }
  ];

  return (
    <div className="about-page-container">
      {/* About Hero Banner */}
      <div className="about-page-hero">
        <div className="about-hero-inner">
          <span className="about-hero-tag">OUR HERITAGE & MISSION</span>
          <h1 className="about-hero-title">REDEFINING INDIAN NATURAL FOODS</h1>
          <p className="about-hero-desc">
            Manufacturing premium quality packaged organic food and beverages the way they should be made — with real ingredients and transparent sourcing.
          </p>
        </div>
      </div>

      {/* Main Story Content Section */}
      <div className="about-content-section">
        <div className="about-grid-container">
          <div className="about-text-block">
            <span className="section-tag">OUR ORIGIN & PHILOSOPHY</span>
            <h2 className="about-section-heading">Devine started with a simple frustration.</h2>
            
            <p>
              Too much of what's sold as "natural" on Indian shelves isn't. We started Devine in 2015 to manufacture premium quality packaged organic food and beverages the way they should be made — with real ingredients, transparent sourcing, and no shortcuts taken to hit a lower price point.
            </p>
            <p>
              We spend real time understanding what our customers actually need before a single jar is filled. That discipline — deep analysis over fast expansion — is what has made Devine one of India's fastest-growing packaged organic food and beverage brands.
            </p>

            {/* Award Recognition Highlight Badge */}
            <div className="about-award-badge-card">
              <div className="award-icon-wrap">🏆</div>
              <div>
                <span className="award-tagline">CONTINUOUS 2016 & 2017 AWARD WINNER</span>
                <h3 className="award-title">Named Best Food Products Manufacturer in Tamil Nadu — two years running.</h3>
              </div>
            </div>

            <div style={{ marginTop: '2.5rem' }}>
              <button onClick={onNavigateProducts} className="btn-pill btn-pill-lime">
                EXPLORE OUR PRODUCTS 🌿
              </button>
            </div>
          </div>

          <div className="about-image-card">
            <img src="/assets/hero.svg" alt="Devine Organic Foods & Beverage Showcase" className="about-feature-img" />
          </div>
        </div>
      </div>

      {/* Growth Milestones Timeline Section (Replaces Four Pillars) */}
      <div className="about-timeline-section">
        <div className="timeline-inner">
          <span className="section-tag" style={{ color: 'var(--bg-yellow)' }}>OUR JOURNEY</span>
          <h2 className="timeline-section-title">From one product to a trusted range.</h2>

          <div className="timeline-cards-grid">
            {milestones.map((item, idx) => (
              <div key={idx} className="timeline-card">
                <div className="timeline-year-badge">{item.year}</div>
                <h3 className="timeline-card-title">{item.title}</h3>
                <p className="timeline-card-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
