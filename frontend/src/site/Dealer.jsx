import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { TrustBand, WA_LINK } from './Layout';

const BUSINESS_TYPES = ['Retail Shop', 'Wholesale Distributor', 'Online Seller (Amazon/Flipkart)', 'Supermarket / Modern Trade', 'Other'];
const CAPACITIES = ['Below Rs.10,000', 'Rs.10,000 - Rs.50,000', 'Rs.50,000 - Rs.2,00,000', 'Above Rs.2,00,000'];
const STATES = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Maharashtra', 'Gujarat', 'Delhi', 'Puducherry', 'Other'];

const BENEFITS = [
  { color: 'var(--amber)', title: '20–35% Dealer Margin', desc: 'Healthy margins that scale with your order volume.' },
  { color: 'var(--olive)', title: 'Fast Dispatch', desc: 'Reliable supply and quick dispatch so you never run out of stock.' },
  { color: 'var(--wine)', title: 'Dedicated Support', desc: 'A Devine area manager to help you grow, with brand & price guides.' }
];

export default function Dealer() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', businessName: '', businessType: '', state: '', district: '', city: '', capacity: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { dealerId, alreadyRegistered, message }
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.phone || !form.businessName || !form.businessType || !form.state || !form.city || !form.capacity) {
      setError('Please fill all required fields.'); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/dealers/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok && data.success) setResult(data);
      else setError(data.message || 'Could not submit. Please try again.');
    } catch { setError('Network error. Please call us directly or try again.'); }
    finally { setSubmitting(false); }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="crumbs"><Link to="/">Home</Link> / Become a Dealer</p>
          <h1>Partner with Devine.</h1>
          <p>Stock India's fast-growing natural food brand. Register below to get dealer pricing, our product catalogue, and a dedicated area manager.</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="section-head align-left"><h2>Why become a Devine dealer?</h2></div>
          <div className="value-grid">
            {BENEFITS.map((b) => (
              <div className="value-card" key={b.title}>
                <div className="hx-icon" style={{ background: b.color }}></div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-ivory-deep">
        <div className="container" style={{ maxWidth: 760 }}>
          {result ? (
            <div className="form-success">
              <h3>{result.alreadyRegistered ? 'Already registered' : '🎉 Welcome to the Devine dealer family!'}</h3>
              <p style={{ marginTop: 8 }}>Your Devine Dealer ID</p>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--amber-light)', margin: '8px 0 14px', letterSpacing: '0.05em' }}>{result.dealerId}</div>
              <p>{result.message}</p>
              <a href={WA_LINK} target="_blank" rel="noreferrer" className="btn btn-light" style={{ marginTop: 18 }}>Open Dealer Portal on WhatsApp</a>
            </div>
          ) : (
            <>
              <div className="section-head align-left"><h2>Dealer registration</h2><p>Fill in your business details. Once registered, message us on WhatsApp and you'll go straight into your dealer portal — no re-registration needed.</p></div>
              <form className="site-form" onSubmit={submit}>
                {error && <div className="field-error" style={{ fontSize: '0.9rem' }}>{error}</div>}
                <div className="form-row">
                  <div><label>Full Name *</label><input value={form.name} onChange={set('name')} placeholder="Your name" /></div>
                  <div><label>WhatsApp Number *</label><input value={form.phone} onChange={set('phone')} placeholder="10-digit mobile number" /></div>
                </div>
                <div className="form-row">
                  <div><label>Business Name *</label><input value={form.businessName} onChange={set('businessName')} placeholder="Your shop / company name" /></div>
                  <div>
                    <label>Business Type *</label>
                    <select value={form.businessType} onChange={set('businessType')}>
                      <option value="">Select…</option>
                      {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <label>State *</label>
                    <select value={form.state} onChange={set('state')}>
                      <option value="">Select…</option>
                      {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label>District</label><input value={form.district} onChange={set('district')} placeholder="District" /></div>
                </div>
                <div className="form-row">
                  <div><label>City / Town *</label><input value={form.city} onChange={set('city')} placeholder="City" /></div>
                  <div>
                    <label>Monthly Purchase Capacity *</label>
                    <select value={form.capacity} onChange={set('capacity')}>
                      <option value="">Select…</option>
                      {CAPACITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div><label>Email (optional)</label><input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" /></div>
                <button type="submit" className={`btn btn-primary${submitting ? ' form-submitting' : ''}`} style={{ justifySelf: 'flex-start' }} disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Register as Dealer'}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      <TrustBand heading="Questions before you register?" />
    </>
  );
}
