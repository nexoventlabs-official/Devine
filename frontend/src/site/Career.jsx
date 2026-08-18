import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const PERKS = [
  { icon: 'linear-gradient(160deg,#E5A860,#8A5320)', title: 'Hands-on Craft', desc: "You'll work close to the product, not buried in process." },
  { icon: 'linear-gradient(160deg,#8FA06B,#4F5C38)', title: 'Real Ownership', desc: 'Small team, real responsibility from day one.' },
  { icon: 'linear-gradient(160deg,#B4586A,#7A2A38)', title: 'Award-winning Standards', desc: 'Join a team recognised two years running for quality.' },
  { icon: 'linear-gradient(160deg,#C9A227,#8A5320)', title: 'Room to Grow', desc: "We're expanding fast — and growing our people with us." }
];

export default function Career() {
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', roleApplied: '', experience: '', coverNote: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.fullName || !form.phone || !form.email || !form.roleApplied || !form.experience || !form.coverNote) {
      setError('Please fill all fields.'); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/careers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok && data.success) setDone(true);
      else setError(data.message || 'Could not submit. Please try again.');
    } catch { setError('Network error. Please call us directly or try again.'); }
    finally { setSubmitting(false); }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="crumbs"><Link to="/">Home</Link> / Career</p>
          <h1>Build something honest with us.</h1>
          <p>We're a growing team in Tamil Nadu looking for people who care about doing food right.</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="section-head align-left"><h2>What it's like to work here.</h2></div>
          <div className="perk-grid">
            {PERKS.map((p) => (
              <div className="perk" key={p.title}>
                <div className="hx-icon" style={{ background: p.icon }}></div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-ivory-deep">
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="section-head align-left"><h2>Apply to join the team.</h2><p>Tell us about yourself — we're always open to hearing from people who care about food craft.</p></div>

          {done ? (
            <div className="form-success">
              <h3>Application received.</h3>
              <p>Thank you for your interest in Devine. If there's a fit, our team will reach out to you directly.</p>
            </div>
          ) : (
            <form className="site-form" onSubmit={submit}>
              {error && <div className="field-error" style={{ fontSize: '0.9rem' }}>{error}</div>}
              <div className="form-row">
                <div><label>Full Name *</label><input value={form.fullName} onChange={set('fullName')} placeholder="Your name" /></div>
                <div><label>Phone *</label><input value={form.phone} onChange={set('phone')} placeholder="+91 00000 00000" /></div>
              </div>
              <div className="form-row">
                <div><label>Email *</label><input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" /></div>
                <div><label>Role Applied For *</label><input value={form.roleApplied} onChange={set('roleApplied')} placeholder="e.g. Production, Sales, Marketing" /></div>
              </div>
              <div><label>Experience *</label><input value={form.experience} onChange={set('experience')} placeholder="e.g. 2 years in FMCG sales" /></div>
              <div><label>Cover Note *</label><textarea value={form.coverNote} onChange={set('coverNote')} placeholder="Tell us why you'd like to join, and share a resume link if you have one." /></div>
              <button type="submit" className={`btn btn-primary${submitting ? ' form-submitting' : ''}`} style={{ justifySelf: 'flex-start' }} disabled={submitting}>
                {submitting ? 'Sending…' : 'Submit Application'}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
