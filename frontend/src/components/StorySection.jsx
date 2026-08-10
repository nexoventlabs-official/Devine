import React from 'react';

export default function StorySection() {
  return (
    <section className="story-section" id="story">
      <div className="story-container">
        <div className="story-img-wrap">
          <img src="https://res.cloudinary.com/zavohueh/image/upload/devine/products/Honey_Fig.png" alt="Devine Natural Foods" />
          <div className="story-badge">
            <h4>DEVINE</h4>
            <p>100% Pure Natural & Organic</p>
          </div>
        </div>

        <div className="story-content">
          <span className="section-tag">OUR JOURNEY</span>
          <h2>TRADITIONAL QUALITY, CRAFTED WITH PASSION</h2>
          <p className="story-quote">
            "We started Devine in 2015 with a simple frustration — too much of what's sold as 'natural' on Indian shelves isn't. We set out to manufacture premium quality packaged organic foods and beverages with real ingredients, transparent sourcing, and zero shortcuts."
          </p>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '2rem' }}>
            Devine spends real time understanding what our customers actually need before a single jar is filled. Deep analysis over fast expansion is what makes Devine one of India's most trusted packaged organic food brands.
          </p>
          <a href="#products" className="btn-pill btn-pill-lime">EXPLORE DEVINE RANGE 🍃</a>
        </div>
      </div>
    </section>
  );
}
