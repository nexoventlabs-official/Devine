import React from 'react';

export default function StorySection() {
  return (
    <section className="story-section" id="story">
      <div className="story-container">
        <div className="story-img-wrap">
          <img src="/assets/blitz_hero_lifestyle.jpg" alt="Blitz Energy Drink Founder Naman and Athletes" />
          <div className="story-badge">
            <h4>NAMAN</h4>
            <p>Pro Golfer & Founder of Blitz</p>
          </div>
        </div>

        <div className="story-content">
          <span className="section-tag">THE FOUNDER'S JOURNEY</span>
          <h2>CRAFTED FOR ATHLETES, BUILT FOR BHARAT</h2>
          <p className="story-quote">
            "As a professional golfer competing in tournament rounds, I needed laser-sharp focus without shaky hands or mid-day fatigue. Every energy drink in the market tasted like medicine and left me crashing. We created Blitz so an energy drink actually tastes amazing while giving you jitter-free stamina."
          </p>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '2rem' }}>
            Blitz bridges high-octane digital branding with retail excellence across India. From golf courses to gaming arenas, gym floors to corporate desks, Bharat runs on Blitz.
          </p>
          <a href="#store-locator" className="btn-pill btn-pill-lime">FIND BLITZ NEAR YOU 📍</a>
        </div>
      </div>
    </section>
  );
}
