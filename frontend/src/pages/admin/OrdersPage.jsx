import React, { useEffect, useState } from 'react';
import { api } from '../../adminApi';
import Loader from './Loader';

const STATUSES = ['confirmed', 'packed', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  async function load() {
    try {
      const res = await api.get('/orders');
      setOrders(res.data || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function updateStatus(orderId, status) {
    setBusy(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      await load();
    } catch (e) { alert(e.message); }
    setBusy('');
  }

  if (loading) return <Loader />;

  return (
    <div style={{ padding: 28, fontFamily: 'SpotifyMixUI, Inter, sans-serif', color: '#ffffff' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#ffffff' }}>Customer Orders</h1>
        <p style={{ margin: '4px 0 0', color: '#b3b3b3', fontSize: 14 }}>Click an order to see full details. Manage delivery statuses and live tracking.</p>
      </div>

      <div style={{ background: '#181818', borderRadius: 8, border: '1px solid #282828', overflow: 'hidden', boxShadow: 'rgba(0,0,0,0.3) 0px 8px 8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#1f1f1f', borderBottom: '1px solid #282828' }}>
              <th style={th}>Order ID</th><th style={th}>Customer</th><th style={th}>Total</th>
              <th style={th}>Payment</th><th style={th}>Status</th><th style={th}>Update</th><th style={th}>Track</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id} onClick={() => setDetail(o)} style={{ borderBottom: '1px solid #252525', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#1f1f1f'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <td style={{ ...td, fontWeight: 700, color: '#1ed760' }}>{o.orderId}</td>
                <td style={td}>
                  <strong>{o.customer?.name}</strong><br />
                  <span style={{ fontSize: 12, color: '#b3b3b3' }}>{o.customer?.phone}</span>
                </td>
                <td style={{ ...td, fontWeight: 700 }}>₹{o.totalAmount}</td>
                <td style={td}>{o.paymentMethod} / {o.paymentStatus}</td>
                <td style={td}><span style={chip}>{(o.status || '').replace(/_/g, ' ')}</span></td>
                <td style={td} onClick={(e) => e.stopPropagation()}>
                  <select disabled={busy === o.orderId} value={o.status}
                    onChange={(e) => updateStatus(o.orderId, e.target.value)} style={selectStyle}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </td>
                <td style={td} onClick={(e) => e.stopPropagation()}><a href={`/track?order=${o.orderId}`} target="_blank" rel="noreferrer" style={{ color: '#1ed760', fontWeight: 700, textDecoration: 'none' }}>Live Map ↗</a></td>
              </tr>
            ))}
            {!orders.length && <tr><td style={{ ...td, color: '#b3b3b3', textAlign: 'center', padding: 24 }} colSpan={7}>No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {detail && <OrderDetailModal order={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function OrderDetailModal({ order, onClose }) {
  const o = order;
  const itemsTotal = o.itemsTotal || (o.items || []).reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
  const mapUrl = o.deliveryLocation?.latitude != null
    ? `https://www.google.com/maps/search/?api=1&query=${o.deliveryLocation.latitude},${o.deliveryLocation.longitude}`
    : '';
  const fmt = (d) => (d ? new Date(d).toLocaleString('en-IN') : '—');

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#1ed760', fontWeight: 700 }}>{o.orderId}</div>
            <div style={{ fontSize: 12, color: '#7c7c7c', marginTop: 2 }}>Placed {fmt(o.createdAt)}</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: '#282828', border: 0, color: '#b3b3b3', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <span style={pill('#1ed760')}>{(o.status || '').replace(/_/g, ' ')}</span>
          <span style={pill(o.paymentStatus === 'paid' ? '#1ed760' : o.paymentStatus === 'failed' ? '#f3727f' : '#ffa42b')}>{o.paymentMethod} · {o.paymentStatus}</span>
        </div>

        {/* Customer */}
        <div style={card}>
          <div style={cardHead}>Customer</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{o.customer?.name || '—'}</div>
          <div style={{ fontSize: 13, color: '#b3b3b3' }}>
            <a href={`https://wa.me/${o.customer?.phone}`} target="_blank" rel="noreferrer" style={{ color: '#e0e0e0' }}>{o.customer?.phone}</a>
          </div>
        </div>

        {/* Items */}
        <div style={card}>
          <div style={cardHead}>Items ({(o.items || []).length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(o.items || []).map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {it.imageUrl
                  ? <img src={it.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', background: '#fff', flexShrink: 0 }} />
                  : <div style={{ width: 44, height: 44, borderRadius: 8, background: '#333', flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
                  <div style={{ fontSize: 12, color: '#b3b3b3' }}>{it.quantity} × ₹{it.price}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>₹{(it.price || 0) * (it.quantity || 1)}</div>
              </div>
            ))}
            {!(o.items || []).length && <div style={{ color: '#7c7c7c', fontSize: 13 }}>No items recorded.</div>}
          </div>
          <div style={{ borderTop: '1px solid #282828', marginTop: 12, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13.5 }}>
            <Row label="Items total" value={`₹${itemsTotal}`} />
            <Row label="Delivery" value={o.deliveryCharge ? `₹${o.deliveryCharge}` : 'Free'} />
            <Row label="Grand total" value={`₹${o.totalAmount}`} bold />
          </div>
        </div>

        {/* Delivery */}
        {(o.deliveryLocation?.address || o.deliveryLocation?.latitude != null) && (
          <div style={card}>
            <div style={cardHead}>Delivery location</div>
            {o.deliveryLocation?.address && <div style={{ fontSize: 13, color: '#e0e0e0', whiteSpace: 'pre-wrap' }}>{o.deliveryLocation.address}</div>}
            {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" style={{ color: '#1ed760', fontSize: 13, fontWeight: 600, display: 'inline-block', marginTop: 6 }}>🗺️ Open in Google Maps</a>}
            {o.expectedDelivery && <div style={{ fontSize: 12, color: '#7c7c7c', marginTop: 6 }}>Expected: {fmt(o.expectedDelivery)}</div>}
          </div>
        )}

        {/* Tracking timeline */}
        {(o.trackingUpdates || []).length > 0 && (
          <div style={card}>
            <div style={cardHead}>Tracking history</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {o.trackingUpdates.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1ed760', marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.message || (t.status || '').replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: 11, color: '#7c7c7c' }}>{fmt(t.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <a href={`/track?order=${o.trackId || o.orderId}`} target="_blank" rel="noreferrer" style={{ ...btn, background: '#1ed760', color: '#000', textDecoration: 'none', textAlign: 'center', flex: 1 }}>Live Map ↗</a>
          {o.invoicePdfUrl && <a href={o.invoicePdfUrl} target="_blank" rel="noreferrer" style={{ ...btn, background: '#282828', color: '#fff', textDecoration: 'none', textAlign: 'center', flex: 1 }}>Invoice PDF</a>}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: '#b3b3b3', fontWeight: bold ? 800 : 400 }}>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 600, color: bold ? '#1ed760' : '#fff', fontSize: bold ? 15 : 13.5 }}>{value}</span>
    </div>
  );
}

const pill = (color) => ({ background: `${color}22`, color, border: `1px solid ${color}55`, padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 700, textTransform: 'capitalize' });
const card = { background: '#181818', border: '1px solid #282828', borderRadius: 12, padding: 16, marginBottom: 14 };
const cardHead = { fontSize: 11, color: '#7c7c7c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 };
const btn = { border: 0, borderRadius: 9999, padding: '10px 18px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 };
const modal = { background: '#1f1f1f', border: '1px solid #282828', borderRadius: 14, padding: 24, width: 'min(560px, 94vw)', maxHeight: '90vh', overflowY: 'auto', color: '#ffffff', boxShadow: 'rgba(0,0,0,0.5) 0px 12px 40px' };
const selectStyle = { padding: '6px 12px', background: '#1f1f1f', color: '#ffffff', border: '1px solid #333', borderRadius: 500, outline: 'none', fontSize: 12, cursor: 'pointer' };
const th = { padding: '14px 16px', fontSize: 12, color: '#b3b3b3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px' };
const td = { padding: '14px 16px', fontSize: 14, color: '#ffffff' };
const chip = { background: 'rgba(30, 215, 96, 0.15)', color: '#1ed760', padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 700, border: '1px solid rgba(30, 215, 96, 0.3)', textTransform: 'capitalize' };
