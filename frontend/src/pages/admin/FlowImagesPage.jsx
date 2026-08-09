import React, { useEffect, useState } from 'react';
import { api } from '../../adminApi';

// Curated keys the flows read from. Grouped for the admin.
const FIELDS = [
  { group: 'B2B', items: [
    { key: 'welcome_banner_b2b', label: 'Welcome banner (B2B)', type: 'image' },
    { key: 'dealer_header', label: 'Dealer header image', type: 'image' },
    { key: 'dealer_pdf', label: 'Dealer info PDF', type: 'pdf' },
    { key: 'bulk_header', label: 'Bulk enquiry header', type: 'image' },
    { key: 'gifting_header', label: 'Corporate gifting header', type: 'image' },
    { key: 'gifting_pdf', label: 'Gifting catalogue PDF', type: 'pdf' },
    { key: 'export_header', label: 'Export header image', type: 'image' },
    { key: 'lead_thanks_header', label: 'Lead thank-you header', type: 'image' }
  ]},
  { group: 'B2C', items: [
    { key: 'welcome_banner_b2c', label: 'Welcome banner (B2C)', type: 'image' },
    { key: 'order_confirmed', label: 'Order confirmed image', type: 'image' },
    { key: 'payment_header', label: 'Payment header image', type: 'image' },
    { key: 'review_header', label: 'Review request header', type: 'image' },
    { key: 'review_5star_header', label: '5-star thank-you header', type: 'image' },
    { key: 'review_issue_header', label: 'Low-rating header', type: 'image' },
    { key: 'delivered_pdf_header', label: 'Delivered/invoice header', type: 'image' }
  ]},
  { group: 'Links', items: [
    { key: 'google_review_link', label: 'Google Review link (URL)', type: 'link' }
  ]}
];

export default function FlowImagesPage() {
  const [assets, setAssets] = useState({});
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    const res = await api.get('/catalog/flow-assets');
    const map = {};
    (res.data || []).forEach((a) => (map[a.key] = a));
    setAssets(map);
  }
  useEffect(() => { load(); }, []);

  async function uploadFile(field, file) {
    setBusy(field.key);
    try {
      const form = new FormData();
      form.append('key', field.key);
      form.append('label', field.label);
      form.append('type', field.type);
      form.append('group', field.group || 'general');
      form.append('file', file);
      await api.postForm('/catalog/flow-assets', form);
      setMsg(`Saved ${field.label}`);
      await load();
    } catch (e) { setMsg(e.message); }
    setBusy('');
  }

  async function saveLink(field, url) {
    setBusy(field.key);
    try {
      await api.post('/catalog/flow-assets', { key: field.key, label: field.label, type: 'link', url, group: 'Links' });
      setMsg(`Saved ${field.label}`);
      await load();
    } catch (e) { setMsg(e.message); }
    setBusy('');
  }

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ marginTop: 0 }}>Flow Images & Assets</h1>
      <p style={{ color: '#666' }}>Upload the icons, banners, PDFs and links used across the WhatsApp flows.</p>
      {msg && <div style={{ background: '#e8f7ec', color: '#1a7f37', padding: 10, borderRadius: 8, marginBottom: 16 }}>{msg}</div>}

      {FIELDS.map((section) => (
        <div key={section.group} style={{ marginBottom: 28 }}>
          <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: 6 }}>{section.group}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
            {section.items.map((field) => {
              const current = assets[field.key];
              return (
                <div key={field.key} style={card}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>{field.label}</div>
                  {current?.url && field.type === 'image' && (
                    <img src={current.url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                  )}
                  {current?.url && field.type === 'pdf' && (
                    <a href={current.url} target="_blank" rel="noreferrer" style={{ color: '#1a7f37' }}>View current PDF</a>
                  )}
                  {field.type === 'link' ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input defaultValue={current?.url || ''} placeholder="https://…" id={`link_${field.key}`} style={input} />
                      <button style={btn} disabled={busy === field.key}
                        onClick={() => saveLink(field, document.getElementById(`link_${field.key}`).value)}>Save</button>
                    </div>
                  ) : (
                    <input type="file" accept={field.type === 'pdf' ? 'application/pdf' : 'image/*'}
                      disabled={busy === field.key}
                      onChange={(e) => e.target.files[0] && uploadFile(field, e.target.files[0])} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const card = { border: '1px solid #eee', borderRadius: 12, padding: 14, background: '#fff' };
const input = { flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 6 };
const btn = { background: '#1a7f37', color: '#fff', border: 0, borderRadius: 6, padding: '8px 14px', cursor: 'pointer' };
