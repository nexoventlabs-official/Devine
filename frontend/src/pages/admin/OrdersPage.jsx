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
    <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ marginTop: 0 }}>Orders</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
            <th style={th}>Order</th><th style={th}>Customer</th><th style={th}>Total</th>
            <th style={th}>Payment</th><th style={th}>Status</th><th style={th}>Update</th><th style={th}>Track</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id} style={{ borderBottom: '1px solid #f2f2f2' }}>
              <td style={td}>{o.orderId}</td>
              <td style={td}>{o.customer?.name}<br /><small>{o.customer?.phone}</small></td>
              <td style={td}>Rs.{o.totalAmount}</td>
              <td style={td}>{o.paymentMethod} / {o.paymentStatus}</td>
              <td style={td}><span style={chip}>{(o.status || '').replace(/_/g, ' ')}</span></td>
              <td style={td}>
                <select disabled={busy === o.orderId} value={o.status}
                  onChange={(e) => updateStatus(o.orderId, e.target.value)} style={{ padding: 6, borderRadius: 6 }}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </td>
              <td style={td}><a href={`/track?order=${o.orderId}`} target="_blank" rel="noreferrer" style={{ color: '#1a7f37' }}>Map</a></td>
            </tr>
          ))}
          {!orders.length && <tr><td style={td} colSpan={7}>No orders yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

const th = { padding: '10px 8px', fontSize: 13, color: '#555' };
const td = { padding: '10px 8px', fontSize: 14 };
const chip = { background: '#e8f7ec', color: '#1a7f37', padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' };
