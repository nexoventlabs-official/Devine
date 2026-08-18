import React from 'react';
import { Link } from 'react-router-dom';
import { AwardBand } from './Layout';

export default function About() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="crumbs"><Link to="/">Home</Link> / About Us</p>
          <h1>Built slowly, on purpose.</h1>
          <p>The story of a Tamil Nadu food company that chose the harder, honest way to grow.</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container story-split">
          <div className="story-image">
            <img src="/site/banners/banner.png" alt="Devine story" />
          </div>
          <div>
            <h2>Devine started with a simple frustration.</h2>
            <p>Too much of what's sold as "natural" on Indian shelves isn't. We started Devine in 2015 to manufacture premium-quality packaged organic food and beverages the way they should be made — with real ingredients, transparent sourcing, and no shortcuts taken to hit a lower price point.</p>
            <p>We spend real time understanding what our customers actually need before a single jar is filled. That discipline — deep analysis over fast expansion — is what has made Devine one of India's fastest-growing packaged organic food and beverage brands.</p>
          </div>
        </div>
      </section>

      <section className="section-pad bg-ivory-deep">
        <div className="container">
          <div className="section-head"><h2>From one product to a trusted range.</h2></div>
          <div className="timeline">
            <div className="t-item"><b>2015 — The Beginning</b><p>Devine is founded in Tamil Nadu with a mission to bring genuinely natural, organic food products to Indian households.</p></div>
            <div className="t-item"><b>2016 — Best Food Products Manufacturer</b><p>Devine is recognised as the Best Food Products Manufacturer in Tamil Nadu for the first time.</p></div>
            <div className="t-item"><b>2017 — Award Retained</b><p>Devine wins the award for a second consecutive year, cementing a reputation for consistent quality.</p></div>
            <div className="t-item"><b>Today — A Growing Family</b><p>A growing signature range, an expanding distribution network, and a customer base that keeps coming back.</p></div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="section-head"><h2>Three commitments we don't compromise on.</h2></div>
          <div className="value-grid">
            <div className="value-card"><div className="hx-icon"></div><h3>Real Ingredients</h3><p>Every product starts as a whole, traceable ingredient — never a syrup base or artificial substitute.</p></div>
            <div className="value-card"><div className="hx-icon" style={{ background: 'var(--olive)' }}></div><h3>Slow Processing</h3><p>We process at the pace the ingredient needs, not the pace that's cheapest for us.</p></div>
            <div className="value-card"><div className="hx-icon" style={{ background: 'var(--wine)' }}></div><h3>Honest Labelling</h3><p>What's on the label is what's in the jar. No hidden additives, no vague "natural flavouring."</p></div>
          </div>
        </div>
      </section>

      <AwardBand />
    </>
  );
}
