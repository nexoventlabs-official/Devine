import React, { useEffect, useState } from 'react';
import { api } from '../../adminApi';

// Curated keys used across WhatsApp flows.
const FIELDS = [
  {
    group: 'B2B',
    items: [
      { key: 'welcome_banner_b2b', label: 'Welcome Banner (B2B)', type: 'image', defaultRatio: '8:1', isBanner: true },
      { key: 'dealer_header', label: 'Dealer Header Image', type: 'image', defaultRatio: '8:1', isBanner: true },
      { key: 'dealer_pdf', label: 'Dealer Info PDF', type: 'pdf' },
      { key: 'bulk_header', label: 'Bulk Enquiry Header', type: 'image', defaultRatio: '1:1' },
      { key: 'gifting_header', label: 'Corporate Gifting Header', type: 'image', defaultRatio: '8:1', isBanner: true },
      { key: 'gifting_pdf', label: 'Gifting Catalogue PDF', type: 'pdf' },
      { key: 'export_header', label: 'Export Header Image', type: 'image', defaultRatio: '8:1', isBanner: true },
      { key: 'lead_thanks_header', label: 'Lead Thank-You Header', type: 'image', defaultRatio: '1:1' }
    ]
  },
  {
    group: 'B2C',
    items: [
      { key: 'welcome_banner_b2c', label: 'Welcome Banner (B2C)', type: 'image', defaultRatio: '8:1', isBanner: true },
      { key: 'order_confirmed', label: 'Order Confirmed Image', type: 'image', defaultRatio: '1:1' },
      { key: 'payment_header', label: 'Payment Header Image', type: 'image', defaultRatio: '8:1', isBanner: true },
      { key: 'review_header', label: 'Review Request Header', type: 'image', defaultRatio: '1:1' },
      { key: 'review_5star_header', label: '5-Star Thank-You Header', type: 'image', defaultRatio: '1:1' },
      { key: 'review_issue_header', label: 'Low-Rating Header', type: 'image', defaultRatio: '1:1' },
      { key: 'delivered_pdf_header', label: 'Delivered/Invoice Header', type: 'image', defaultRatio: '8:1', isBanner: true }
    ]
  },
  {
    group: 'Links',
    items: [
      { key: 'google_review_link', label: 'Google Review Link (URL)', type: 'link' }
    ]
  }
];

export default function FlowImagesPage() {
  const [assets, setAssets] = useState({});
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'banners' | 'icons' | 'docs'
  const [ratioSelections, setRatioSelections] = useState({});

  async function load() {
    try {
      const res = await api.get('/catalog/flow-assets');
      const map = {};
      (res.data || []).forEach((a) => (map[a.key] = a));
      setAssets(map);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => { load(); }, []);

  function handleRatioChange(key, ratio) {
    setRatioSelections((prev) => ({ ...prev, [key]: ratio }));
  }

  async function uploadFile(field, file) {
    setBusy(field.key);
    try {
      const targetRatio = ratioSelections[field.key] || field.defaultRatio || (field.isBanner ? '8:1' : '1:1');
      const form = new FormData();
      form.append('key', field.key);
      form.append('label', field.label);
      form.append('type', field.type);
      form.append('group', field.group || 'general');
      form.append('aspectRatio', targetRatio);
      form.append('file', file);

      await api.postForm('/catalog/flow-assets', form);
      setMsg(`Uploaded ${field.label} successfully in ${targetRatio} ratio!`);
      await load();
      setTimeout(() => setMsg(''), 5000);
    } catch (e) {
      setMsg(e.message || 'Upload failed');
    }
    setBusy('');
  }

  async function saveLink(field, url) {
    setBusy(field.key);
    try {
      await api.post('/catalog/flow-assets', { key: field.key, label: field.label, type: 'link', url, group: 'Links' });
      setMsg(`Saved ${field.label}`);
      await load();
      setTimeout(() => setMsg(''), 5000);
    } catch (e) {
      setMsg(e.message || 'Save failed');
    }
    setBusy('');
  }

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif", maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginTop: 0, marginBottom: 6, fontSize: 26, color: '#111827' }}>Flow Images & Assets</h1>
        <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>
          Manage WhatsApp Flow images, welcome banners (8:1 ratio), service icons, PDFs, and links.
        </p>
      </div>

      {msg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontWeight: 500 }}>
          {msg}
        </div>
      )}

      {/* FILTER RADIO BUTTONS GROUP */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          Filter Asset Category (Select Option)
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { id: 'all', label: 'All Flow Assets' },
            { id: 'banners', label: 'Banners (8:1 Aspect Ratio)' },
            { id: 'icons', label: 'Service Icons (1:1 Aspect Ratio)' },
            { id: 'docs', label: 'PDF Documents & Links' }
          ].map((option) => (
            <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: filterType === option.id ? 600 : 400, color: filterType === option.id ? '#1a7f37' : '#4b5563' }}>
              <input
                type="radio"
                name="filter_asset_type"
                value={option.id}
                checked={filterType === option.id}
                onChange={() => setFilterType(option.id)}
                style={{ accentColor: '#1a7f37', width: 16, height: 16, cursor: 'pointer' }}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {FIELDS.map((section) => {
        const filteredItems = section.items.filter((field) => {
          if (filterType === 'all') return true;
          if (filterType === 'banners') return field.isBanner || field.defaultRatio === '8:1';
          if (filterType === 'icons') return field.type === 'image' && !field.isBanner && field.defaultRatio !== '8:1';
          if (filterType === 'docs') return field.type === 'pdf' || field.type === 'link';
          return true;
        });

        if (!filteredItems.length) return null;

        return (
          <div key={section.group} style={{ marginBottom: 32 }}>
            <h3 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: 8, marginTop: 0, marginBottom: 18, color: '#111827', fontSize: 18 }}>
              {section.group} Assets
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {filteredItems.map((field) => {
                const current = assets[field.key];
                const activeRatio = ratioSelections[field.key] || field.defaultRatio || (field.isBanner ? '8:1' : '1:1');
                const isBannerView = activeRatio === '8:1';

                return (
                  <div key={field.key} style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: 15 }}>{field.label}</div>
                      {field.type === 'image' && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: isBannerView ? '#dbeafe' : '#f3e8ff', color: isBannerView ? '#1e40af' : '#6b21a8' }}>
                          {activeRatio} {isBannerView ? 'Banner' : 'Icon'}
                        </span>
                      )}
                    </div>

                    {/* IMAGE PREVIEW CONTAINER */}
                    {field.type === 'image' && (
                      <div style={{
                        background: '#f3f4f6',
                        borderRadius: 10,
                        overflow: 'hidden',
                        marginBottom: 12,
                        position: 'relative',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: isBannerView ? 80 : 160
                      }}>
                        {current?.url ? (
                          <img
                            src={current.url}
                            alt={field.label}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
                            <div>No image uploaded</div>
                            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                              {isBannerView ? '1000 × 125px (8:1 ratio)' : '600 × 600px (1:1 ratio)'}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {current?.url && field.type === 'pdf' && (
                      <div style={{ marginBottom: 12, padding: 10, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                        <a href={current.url} target="_blank" rel="noreferrer" style={{ color: '#15803d', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                          📄 View Current PDF Document ↗
                        </a>
                      </div>
                    )}

                    {/* RATIO SELECTION RADIO BUTTONS (For Image Uploads) */}
                    {field.type === 'image' && (
                      <div style={{ marginBottom: 12, padding: '8px 10px', background: '#f9fafb', borderRadius: 8, border: '1px solid #f3f4f6' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>
                          Target Upload Aspect Ratio:
                        </div>
                        <div style={{ display: 'flex', gap: 14 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12, color: '#374151' }}>
                            <input
                              type="radio"
                              name={`ratio_${field.key}`}
                              value="8:1"
                              checked={activeRatio === '8:1'}
                              onChange={() => handleRatioChange(field.key, '8:1')}
                              style={{ accentColor: '#1a7f37' }}
                            />
                            8:1 Banner (1000×125)
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12, color: '#374151' }}>
                            <input
                              type="radio"
                              name={`ratio_${field.key}`}
                              value="1:1"
                              checked={activeRatio === '1:1'}
                              onChange={() => handleRatioChange(field.key, '1:1')}
                              style={{ accentColor: '#1a7f37' }}
                            />
                            1:1 Icon (600×600)
                          </label>
                        </div>
                      </div>
                    )}

                    {/* ACTIONS */}
                    {field.type === 'link' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          defaultValue={current?.url || ''}
                          placeholder="https://…"
                          id={`link_${field.key}`}
                          style={input}
                        />
                        <button
                          style={btn}
                          disabled={busy === field.key}
                          onClick={() => saveLink(field, document.getElementById(`link_${field.key}`).value)}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="file"
                          accept={field.type === 'pdf' ? 'application/pdf' : 'image/*'}
                          disabled={busy === field.key}
                          id={`file_${field.key}`}
                          style={{ display: 'none' }}
                          onChange={(e) => e.target.files[0] && uploadFile(field, e.target.files[0])}
                        />
                        <button
                          style={{ ...btn, flex: 1, textAlign: 'center' }}
                          disabled={busy === field.key}
                          onClick={() => document.getElementById(`file_${field.key}`).click()}
                        >
                          {busy === field.key ? 'Uploading...' : `Upload ${field.type === 'pdf' ? 'PDF' : 'Image'}`}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* GUIDELINES INFO CARD */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: 18, marginTop: 30 }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#1e40af', fontSize: 15 }}>Flow Image Ratio & Upload Guidelines</h4>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#1e3a8a', fontSize: 13, lineHeight: '1.6' }}>
          <li><strong>Welcome Banners:</strong> Recommended 1000 × 125px (8:1 landscape ratio) — automatically cropped and centered on upload.</li>
          <li><strong>Service Icons & Flow Cards:</strong> Recommended 600 × 600px (1:1 square ratio).</li>
          <li><strong>PDF Documents:</strong> Maximum file size 10MB (application/pdf).</li>
          <li><strong>Optimization:</strong> Uploaded images are scaled and served via Cloudinary CDN for instant WhatsApp delivery.</li>
        </ul>
      </div>
    </div>
  );
}

const card = {
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  padding: 16,
  background: '#ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  justify: 'space-between'
};

const input = {
  flex: 1,
  padding: '9px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 13
};

const btn = {
  background: '#1a7f37',
  color: '#ffffff',
  border: 0,
  borderRadius: 8,
  padding: '9px 16px',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer'
};

