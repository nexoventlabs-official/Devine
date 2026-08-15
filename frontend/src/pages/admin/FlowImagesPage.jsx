import React, { useEffect, useState } from 'react';
import { api } from '../../adminApi';
import Loader from './Loader';

// Curated keys used across WhatsApp flows.
const FIELDS = [
  {
    group: 'B2B',
    items: [
      { key: 'welcome_header_b2b', label: 'Welcome Message Header (B2B)', type: 'image', defaultRatio: 'original' },
      { key: 'welcome_banner_b2b', label: 'Choose Service Banner (B2B, 8:1)', type: 'image', defaultRatio: '8:1', isBanner: true },
      { key: 'b2b_icon_dealer', label: 'Dealer Service Icon (1:1)', type: 'image', defaultRatio: '1:1' },
      { key: 'b2b_icon_bulk', label: 'Bulk/Wholesale Icon (1:1)', type: 'image', defaultRatio: '1:1' },
      { key: 'b2b_icon_gifting', label: 'Corporate Gifting Icon (1:1)', type: 'image', defaultRatio: '1:1' },
      { key: 'b2b_icon_export', label: 'Export Supply Icon (1:1)', type: 'image', defaultRatio: '1:1' },
      { key: 'dealer_header', label: 'Dealer Header Image', type: 'image', defaultRatio: 'original' },
      { key: 'dealer_pdf', label: 'Dealer Info PDF', type: 'pdf' },
      { key: 'bulk_header', label: 'Bulk Enquiry Header', type: 'image', defaultRatio: 'original' },
      { key: 'gifting_header', label: 'Corporate Gifting Header', type: 'image', defaultRatio: 'original' },
      { key: 'gifting_pdf', label: 'Gifting Catalogue PDF', type: 'pdf' },
      { key: 'export_header', label: 'Export Header Image', type: 'image', defaultRatio: 'original' },
      { key: 'lead_thanks_header', label: 'Lead Thank-You Header', type: 'image', defaultRatio: 'original' }
    ]
  },
  {
    group: 'B2C',
    items: [
      { key: 'welcome_header_b2c', label: 'Welcome Chat Message Header', type: 'image', defaultRatio: 'original' },
      { key: 'welcome_banner_b2c', label: 'Choose Service Flow Banner (8:1)', type: 'image', defaultRatio: '8:1', isBanner: true },
      { key: 'order_summary_header', label: 'Order Summary Header', type: 'image', defaultRatio: 'original' },
      { key: 'payment_logo_online', label: 'Online Payment Logo (1:1)', type: 'image', defaultRatio: '1:1' },
      { key: 'payment_logo_cod', label: 'Cash on Delivery Logo (1:1)', type: 'image', defaultRatio: '1:1' },
      { key: 'b2c_icon_browse', label: 'Browse Products Icon (1:1)', type: 'image', defaultRatio: '1:1' },
      { key: 'b2c_icon_gifting', label: 'Corporate Gifting Icon (1:1)', type: 'image', defaultRatio: '1:1' },
      { key: 'b2c_icon_track', label: 'Track Order Icon (1:1)', type: 'image', defaultRatio: '1:1' },
      { key: 'b2c_icon_talk', label: 'Talk to Us Icon (1:1)', type: 'image', defaultRatio: '1:1' },
      { key: 'talk_header', label: 'Talk to Us Message Header', type: 'image', defaultRatio: 'original' },
      { key: 'track_header', label: 'Track Order Message Header (fallback)', type: 'image', defaultRatio: 'original' },
      { key: 'order_confirmed', label: 'Order Confirmed Image', type: 'image', defaultRatio: 'original' },
      { key: 'payment_header', label: 'Payment Header Image', type: 'image', defaultRatio: 'original' },
      { key: 'review_header', label: 'Review Request Header', type: 'image', defaultRatio: 'original' },
      { key: 'review_5star_header', label: '5-Star Thank-You Header', type: 'image', defaultRatio: 'original' },
      { key: 'review_issue_header', label: 'Low-Rating Header', type: 'image', defaultRatio: 'original' },
      { key: 'delivered_pdf_header', label: 'Delivered/Invoice Header', type: 'image', defaultRatio: 'original' },
      { key: 'order_status_pending', label: 'Order Status: Pending (1:1)', type: 'image', defaultRatio: '1:1' },
      { key: 'order_status_confirmed', label: 'Order Status: Confirmed (1:1)', type: 'image', defaultRatio: '1:1' },
      { key: 'order_status_packed', label: 'Order Status: Packed (1:1)', type: 'image', defaultRatio: '1:1' },
      { key: 'order_status_dispatched', label: 'Order Status: Dispatched (1:1)', type: 'image', defaultRatio: '1:1' },
      { key: 'order_status_out_for_delivery', label: 'Order Status: Out for Delivery (1:1)', type: 'image', defaultRatio: '1:1' },
      { key: 'order_status_delivered', label: 'Order Status: Delivered (1:1)', type: 'image', defaultRatio: '1:1' },
      { key: 'order_status_cancelled', label: 'Order Status: Cancelled (1:1)', type: 'image', defaultRatio: '1:1' }
    ]
  },
  {
    group: 'Links',
    items: [
      { key: 'google_review_link', label: 'Google Review Link (URL)', type: 'link' },
      { key: 'office_location', label: 'Office Location (Google Maps link or "lat,lng")', type: 'link' }
    ]
  }
];

export default function FlowImagesPage() {
  const [assets, setAssets] = useState({});
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'banners' | 'icons' | 'docs'
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get('/catalog/flow-assets');
      const map = {};
      (res.data || []).forEach((a) => (map[a.key] = a));
      setAssets(map);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function uploadFile(field, file) {
    setBusy(field.key);
    try {
      const targetRatio = field.defaultRatio || (field.isBanner ? '8:1' : '1:1');
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

  if (loading) return <Loader />;

  return (
    <div style={{ padding: 28, fontFamily: 'SpotifyMixUI, Inter, sans-serif', maxWidth: 1200, margin: '0 auto', color: '#ffffff' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginTop: 0, marginBottom: 6, fontSize: 24, fontWeight: 700, color: '#ffffff' }}>Flow Images & Assets</h1>
        <p style={{ color: '#b3b3b3', margin: 0, fontSize: 14 }}>
          Manage WhatsApp Flow images, welcome banners (8:1 ratio), service icons, PDFs, and links.
        </p>
      </div>

      {msg && (
        <div style={{ background: 'rgba(30, 215, 96, 0.15)', border: '1px solid rgba(30, 215, 96, 0.3)', color: '#1ed760', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {/* FILTER RADIO BUTTONS GROUP */}
      <div style={{ background: '#181818', border: '1px solid #282828', borderRadius: 8, padding: 18, marginBottom: 28, boxShadow: 'rgba(0,0,0,0.3) 0px 8px 8px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#b3b3b3', textTransform: 'uppercase', letterSpacing: '1.4px', marginBottom: 12 }}>
          Filter Asset Category
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { id: 'all', label: 'All Flow Assets' },
            { id: 'banners', label: 'Banners (8:1)' },
            { id: 'icons', label: 'Service Icons (1:1)' },
            { id: 'docs', label: 'PDF Documents & Links' }
          ].map((option) => (
            <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: filterType === option.id ? 700 : 400, color: filterType === option.id ? '#1ed760' : '#b3b3b3' }}>
              <input
                type="radio"
                name="filter_asset_type"
                value={option.id}
                checked={filterType === option.id}
                onChange={() => setFilterType(option.id)}
                style={{ accentColor: '#1ed760', width: 16, height: 16, cursor: 'pointer' }}
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
            <h3 style={{ borderBottom: '1px solid #282828', paddingBottom: 10, marginTop: 0, marginBottom: 18, color: '#ffffff', fontSize: 18, fontWeight: 700 }}>
              {section.group} Assets
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {filteredItems.map((field) => {
                const current = assets[field.key];
                const activeRatio = field.defaultRatio || (field.isBanner ? '8:1' : '1:1');
                const isOriginal = activeRatio === 'original';
                const isBannerView = activeRatio === '8:1';
                const [rW, rH] = isOriginal ? [] : activeRatio.split(':').map(Number);
                const previewAspect = rW && rH ? `${rW} / ${rH}` : '1 / 1';
                const isWidePreview = rW && rH ? rW / rH >= 2 : false;

                return (
                  <div key={field.key} style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, color: '#ffffff', fontSize: 14 }}>{field.label}</div>
                      {field.type === 'image' && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: '#252525', color: '#1ed760', border: '1px solid rgba(30,215,96,0.3)', textTransform: 'uppercase' }}>
                          {isOriginal ? 'Original' : activeRatio}
                        </span>
                      )}
                    </div>

                    {/* IMAGE PREVIEW CONTAINER */}
                    {field.type === 'image' && (
                      <div style={{
                        background: '#1f1f1f',
                        borderRadius: 8,
                        overflow: 'hidden',
                        marginBottom: 14,
                        position: 'relative',
                        border: '1px solid #333333',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: isOriginal ? '100%' : (isWidePreview ? '100%' : 180),
                        maxWidth: '100%',
                        ...(isOriginal ? { minHeight: 120, maxHeight: 240, padding: 6 } : { aspectRatio: previewAspect }),
                        margin: (isOriginal || isWidePreview) ? '0 0 14px' : '0 auto 14px'
                      }}>
                        {current?.url ? (
                          <img
                            src={current.url}
                            alt={field.label}
                            style={{
                              width: isOriginal ? 'auto' : '100%',
                              height: isOriginal ? 'auto' : '100%',
                              maxWidth: '100%',
                              maxHeight: isOriginal ? 228 : '100%',
                              objectFit: isOriginal ? 'contain' : 'cover'
                            }}
                          />
                        ) : (
                          <div style={{ textAlign: 'center', color: '#7c7c7c', fontSize: 12, padding: 8 }}>
                            <div>No image uploaded</div>
                            <div style={{ fontSize: 11, color: '#b3b3b3', marginTop: 2 }}>
                              {isOriginal ? 'Original ratio kept' : `${activeRatio} ratio`}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {current?.url && field.type === 'pdf' && (
                      <div style={{ marginBottom: 14, padding: 12, background: 'rgba(30, 215, 96, 0.1)', borderRadius: 6, border: '1px solid rgba(30, 215, 96, 0.3)' }}>
                        <a href={current.url} target="_blank" rel="noreferrer" style={{ color: '#1ed760', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                          View Current PDF Document ↗
                        </a>
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
      <div style={{ background: '#181818', border: '1px solid #1ed760', borderRadius: 8, padding: 20, marginTop: 30, boxShadow: 'rgba(0,0,0,0.3) 0px 8px 8px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1ed760', fontSize: 15, fontWeight: 700 }}>Flow Image Ratio & Upload Guidelines</h4>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#b3b3b3', fontSize: 13, lineHeight: '1.6' }}>
          <li><strong>Welcome Banners:</strong> Recommended 1000 × 125px (8:1 landscape ratio).</li>
          <li><strong>Service Icons & Flow Cards:</strong> Recommended 600 × 600px (1:1 square ratio).</li>
          <li><strong>PDF Documents:</strong> Maximum file size 10MB (application/pdf).</li>
          <li><strong>Optimization:</strong> Uploaded images are scaled and served via Cloudinary CDN.</li>
        </ul>
      </div>
    </div>
  );
}

const card = {
  border: '1px solid #282828',
  borderRadius: 8,
  padding: 18,
  background: '#181818',
  boxShadow: 'rgba(0,0,0,0.3) 0px 8px 8px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
};

const input = {
  flex: 1,
  padding: '9px 14px',
  background: '#1f1f1f',
  border: '1px solid #333',
  borderRadius: 500,
  color: '#ffffff',
  fontSize: 13,
  outline: 'none'
};

const btn = {
  background: '#1ed760',
  color: '#000000',
  border: 0,
  borderRadius: 9999,
  padding: '10px 18px',
  fontWeight: 700,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '1.4px',
  cursor: 'pointer'
};


