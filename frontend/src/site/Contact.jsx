import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { TrustBand, WA_LINK, PHONES } from './Layout';

const WaIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
);

export default function Contact() {
  const [params] = useSearchParams();
  const preProduct = params.get('product') || '';
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', productInquired: preProduct, message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/products`);
        const json = await res.json();
        setProducts(json.data || []);
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => { if (preProduct) setForm((f) => ({ ...f, productInquired: preProduct })); }, [preProduct]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.phone || !form.email || !form.message) { setError('Please fill name, phone, email and message.'); return; }
    const payload = { ...form, productInquired: form.productInquired || 'General Enquiry', inquiryType: 'Product Inquiry & Pricing' };
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/enquiries`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) setDone(true);
      else if (data.duplicate) setError(`You have already requested an enquiry for "${payload.productInquired}". Please use another number or contact us directly.`);
      else setError(data.message || 'Could not submit. Please try again.');
    } catch { setError('Network error. Please call us directly or try again.'); }
    finally { setSubmitting(false); }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="crumbs"><Link to="/">Home</Link> / Contact Us</p>
          <h1>Let's talk.</h1>
          <p>Questions about stocking Devine, bulk orders, or joining the team — we'd love to hear from you.</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container contact-split">
          <div className="info-card">
            <h3>Reach us directly</h3>
            <div className="info-row"><div className="hx-icon"></div><div><b>Call Us</b><span>{PHONES[0].label}<br />{PHONES[1].label}</span></div></div>
            <div className="info-row"><div className="hx-icon"></div><div><b>Email Us</b><span><a href="mailto:hello@devine.co.in" style={{ color: 'rgba(245,246,241,0.65)' }}>hello@devine.co.in</a></span></div></div>
            <div className="info-row"><div className="hx-icon"></div><div><b>Visit Us</b><span>Devine Manufacturing Unit<br />Tamil Nadu, India</span></div></div>
            <div className="info-row"><div className="hx-icon"></div><div><b>Working Hours</b><span>Mon – Sat, 9:00 AM – 6:00 PM</span></div></div>
          </div>

          <div>
            {done ? (
              <div className="form-success">
                <h3>Message received.</h3>
                <p>We'll get back to you within one business day. You can also reach us directly on the numbers below.</p>
              </div>
            ) : (
              <form className="site-form" onSubmit={submit}>
                {error && <div className="field-error" style={{ fontSize: '0.9rem' }}>{error}</div>}
                <div className="form-row">
                  <div><label>Full Name *</label><input value={form.name} onChange={set('name')} placeholder="Your name" /></div>
                  <div><label>Phone Number *</label><input value={form.phone} onChange={set('phone')} placeholder="+91 00000 00000" /></div>
                </div>
                <div className="form-row">
                  <div><label>Email Address *</label><input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" /></div>
                  <div>
                    <label>Product of Interest</label>
                    <select value={form.productInquired} onChange={set('productInquired')}>
                      <option value="">General Enquiry</option>
                      {products.map((p) => <option key={p._id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div><label>Message *</label><textarea value={form.message} onChange={set('message')} placeholder="Tell us a bit more…" /></div>
                <button type="submit" className={`btn btn-primary${submitting ? ' form-submitting' : ''}`} style={{ justifySelf: 'flex-start' }} disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send Enquiry'}
                </button>
              </form>
            )}

            <a href={WA_LINK} target="_blank" rel="noreferrer" className="wa-contact-alt"><WaIcon /> Or chat with us on WhatsApp</a>
          </div>
        </div>
      </section>

      <TrustBand heading="Prefer to talk right now?" />
    </>
  );
}
