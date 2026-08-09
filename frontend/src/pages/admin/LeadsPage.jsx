import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../adminApi';
import { SERVER_ORIGIN, ADMIN_TOKEN_KEY } from '../../config';

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
  const [toast, setToast] = useState(null);
  const esRef = useRef(null);

  async function load() {
    const res = await api.get(`/leads${channel ? `?channel=${channel}` : ''}`);
    setLeads(res.data || []);
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

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Leads (Live)</h1>
        <select value={channel} onChange={(e) => setChannel(e.target.value)} style={{ padding: 8, borderRadius: 6 }}>
          <option value="">All channels</option>
          <option value="b2b">B2B</option>
          <option value="b2c">B2C</option>
        </select>
      </div>

      {toast && (
        <div style={toastStyle}>
          🔔 <b>New {TYPE_LABEL[toast.type] || 'Lead'}</b><br />
          Name: {toast.name || '-'} | {toast.businessName || toast.city || ''}<br />
          Capacity: {toast.capacity || '-'} | Action: Call within 2 hours
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
            <th style={th}>Type</th><th style={th}>Name</th><th style={th}>Phone</th>
            <th style={th}>Business/City</th><th style={th}>Capacity</th><th style={th}>Time</th><th style={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l._id || l.phone + l.createdAt} style={{ borderBottom: '1px solid #f2f2f2' }}>
              <td style={td}><span style={chip}>{TYPE_LABEL[l.type] || l.type}</span></td>
              <td style={td}>{l.name || '-'}</td>
              <td style={td}>{l.phone}</td>
              <td style={td}>{l.businessName || l.city || l.district || '-'}</td>
              <td style={td}>{l.capacity || '-'}</td>
              <td style={td}>{new Date(l.createdAt).toLocaleString('en-IN')}</td>
              <td style={td}>{l.status || 'New'}</td>
            </tr>
          ))}
          {!leads.length && <tr><td style={td} colSpan={7}>No leads yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

const th = { padding: '10px 8px', fontSize: 13, color: '#555' };
const td = { padding: '10px 8px', fontSize: 14 };
const chip = { background: '#e8f7ec', color: '#1a7f37', padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 };
const toastStyle = { position: 'fixed', top: 20, right: 20, background: '#1a7f37', color: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.2)', zIndex: 1000, maxWidth: 320, lineHeight: 1.5 };
