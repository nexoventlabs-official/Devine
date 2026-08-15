import React, { useEffect, useState } from 'react';
import { api } from '../../adminApi';

const STATUSES = ['confirmed', 'packed', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState('');

  async function load() {
    const res = await api.get('/orders');
    setOrders(res.data || []);
  }
  useEffect(() => { load(); }, []);

  async function updateStatus(orderId, status) {
    setBusy(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      await load();
    } catch (e) { alert(e.message); }
    setBusy('');
  }

  return (
    <div style={{ padding: 28, fontFamily: 'SpotifyMixUI, Inter, sans-serif', color: '#ffffff' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#ffffff' }}>Customer Orders</h1>
        <p style={{ margin: '4px 0 0', color: '#b3b3b3', fontSize: 14 }}>Manage customer orders, delivery statuses, and live tracking.</p>
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
              <tr key={o._id} style={{ borderBottom: '1px solid #252525' }}>
                <td style={{ ...td, fontWeight: 700, color: '#1ed760' }}>{o.orderId}</td>
                <td style={td}>
                  <strong>{o.customer?.name}</strong><br />
                  <span style={{ fontSize: 12, color: '#b3b3b3' }}>{o.customer?.phone}</span>
                </td>
                <td style={{ ...td, fontWeight: 700 }}>₹{o.totalAmount}</td>
                <td style={td}>{o.paymentMethod} / {o.paymentStatus}</td>
                <td style={td}><span style={chip}>{(o.status || '').replace(/_/g, ' ')}</span></td>
                <td style={td}>
                  <select disabled={busy === o.orderId} value={o.status}
                    onChange={(e) => updateStatus(o.orderId, e.target.value)} style={selectStyle}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </td>
                <td style={td}><a href={`/track?order=${o.orderId}`} target="_blank" rel="noreferrer" style={{ color: '#1ed760', fontWeight: 700, textDecoration: 'none' }}>Live Map ↗</a></td>
              </tr>
            ))}
            {!orders.length && <tr><td style={{ ...td, color: '#b3b3b3', textAlign: 'center', padding: 24 }} colSpan={7}>No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const selectStyle = { padding: '6px 12px', background: '#1f1f1f', color: '#ffffff', border: '1px solid #333', borderRadius: 500, outline: 'none', fontSize: 12, cursor: 'pointer' };
const th = { padding: '14px 16px', fontSize: 12, color: '#b3b3b3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px' };
const td = { padding: '14px 16px', fontSize: 14, color: '#ffffff' };
const chip = { background: 'rgba(30, 215, 96, 0.15)', color: '#1ed760', padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 700, border: '1px solid rgba(30, 215, 96, 0.3)', textTransform: 'capitalize' };

