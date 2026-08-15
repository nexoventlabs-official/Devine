import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../adminApi';
import { SERVER_ORIGIN, ADMIN_TOKEN_KEY } from '../../config';
import Loader from './Loader';

const TYPE_LABEL = {
  dealer: 'Dealer', bulk: 'Bulk/Wholesale', gifting: 'Corporate Gifting',
  export: 'Export', export_enquiry: 'Export Enquiry', support: 'Support', review_issue: 'Review Issue'
};

// Short beep via WebAudio (no asset needed).
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    o.start(); o.stop(ctx.currentTime + 0.5);
  } catch {}
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [channel, setChannel] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const esRef = useRef(null);

  async function load() {
    try {
      const res = await api.get(`/leads${channel ? `?channel=${channel}` : ''}`);
      setLeads(res.data || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [channel]);

  // Real-time stream
  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const es = new EventSource(`${SERVER_ORIGIN}/api/leads/stream?token=${encodeURIComponent(token || '')}`);
    esRef.current = es;
    es.addEventListener('lead', (e) => {
      const lead = JSON.parse(e.data);
      beep();
      setToast(lead);
      setLeads((prev) => [lead, ...prev]);
      setTimeout(() => setToast(null), 8000);
    });
    es.onerror = () => {};
    return () => es.close();
  }, []);

  if (loading) return <Loader />;

  return (
    <div style={{ padding: 28, fontFamily: 'SpotifyMixUI, Inter, sans-serif', color: '#ffffff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#ffffff' }}>Leads (Live)</h1>
          <p style={{ margin: '4px 0 0', color: '#b3b3b3', fontSize: 14 }}>Real-time stream of incoming business leads.</p>
        </div>
        <select value={channel} onChange={(e) => setChannel(e.target.value)} style={selectStyle}>
          <option value="">All channels</option>
          <option value="b2b">B2B</option>
          <option value="b2c">B2C</option>
        </select>
      </div>

      {toast && (
        <div style={toastStyle}>
          <div style={{ fontWeight: 700, color: '#1ed760', fontSize: 13, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>New {TYPE_LABEL[toast.type] || 'Lead'}</div>
          <div>Name: {toast.name || '-'} | {toast.businessName || toast.city || ''}</div>
          <div style={{ fontSize: 12, color: '#b3b3b3', marginTop: 4 }}>Capacity: {toast.capacity || '-'} | Action: Call within 2 hours</div>
        </div>
      )}

      <div style={{ background: '#181818', borderRadius: 8, border: '1px solid #282828', overflow: 'hidden', boxShadow: 'rgba(0,0,0,0.3) 0px 8px 8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#1f1f1f', borderBottom: '1px solid #282828' }}>
              <th style={th}>Type</th><th style={th}>Name</th><th style={th}>Phone</th>
              <th style={th}>Business/City</th><th style={th}>Capacity</th><th style={th}>Time</th><th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l._id || l.phone + l.createdAt} style={{ borderBottom: '1px solid #252525' }}>
                <td style={td}><span style={chip}>{TYPE_LABEL[l.type] || l.type}</span></td>
                <td style={{ ...td, fontWeight: 700 }}>{l.name || '-'}</td>
                <td style={td}>{l.phone}</td>
                <td style={td}>{l.businessName || l.city || l.district || '-'}</td>
                <td style={td}>{l.capacity || '-'}</td>
                <td style={{ ...td, color: '#b3b3b3', fontSize: 13 }}>{new Date(l.createdAt).toLocaleString('en-IN')}</td>
                <td style={td}><span style={{ color: '#1ed760', fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>{l.status || 'New'}</span></td>
              </tr>
            ))}
            {!leads.length && <tr><td style={{ ...td, color: '#b3b3b3', textAlign: 'center', padding: 24 }} colSpan={7}>No leads yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const selectStyle = { padding: '8px 16px', background: '#1f1f1f', color: '#ffffff', border: '1px solid #333', borderRadius: 500, outline: 'none', fontSize: 13, cursor: 'pointer' };
const th = { padding: '14px 16px', fontSize: 12, color: '#b3b3b3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px' };
const td = { padding: '14px 16px', fontSize: 14, color: '#ffffff' };
const chip = { background: 'rgba(30, 215, 96, 0.15)', color: '#1ed760', padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 700, border: '1px solid rgba(30, 215, 96, 0.3)' };
const toastStyle = { position: 'fixed', top: 24, right: 24, background: '#1f1f1f', color: '#fff', padding: 18, borderRadius: 8, border: '1px solid #1ed760', boxShadow: 'rgba(0,0,0,0.5) 0px 8px 24px', zIndex: 1000, maxWidth: 340, lineHeight: 1.5 };

