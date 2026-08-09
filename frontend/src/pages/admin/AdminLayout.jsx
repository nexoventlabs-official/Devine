import React, { useState } from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { API_BASE_URL, ADMIN_TOKEN_KEY } from '../../config';
import ProductsAdminPage from './ProductsPage';
import CategoriesPage from './CategoriesPage';
import FlowImagesPage from './FlowImagesPage';
import SupplyCountriesPage from './SupplyCountriesPage';
import LeadsPage from './LeadsPage';
import OrdersPage from './OrdersPage';

function Login({ onLogin }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  async function submit(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });
      const json = await res.json();
      if (json.success) { localStorage.setItem(ADMIN_TOKEN_KEY, json.token); onLogin(); }
      else setErr(json.message || 'Login failed');
    } catch { setErr('Login failed'); }
  }
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <form onSubmit={submit} style={{ width: 320, padding: 28, border: '1px solid #eee', borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,.06)' }}>
        <h2 style={{ marginTop: 0, color: '#1a7f37' }}>Devine Admin</h2>
        {err && <div style={{ color: '#c0392b', marginBottom: 10 }}>{err}</div>}
        <input placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} style={inp} />
        <input placeholder="Password" type="password" value={p} onChange={(e) => setP(e.target.value)} style={inp} />
        <button style={{ width: '100%', padding: 10, background: '#1a7f37', color: '#fff', border: 0, borderRadius: 8, cursor: 'pointer' }}>Sign in</button>
      </form>
    </div>
  );
}

const inp = { width: '100%', padding: 10, marginBottom: 12, border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box' };

const NAV = [
  { to: '/admin/leads', label: '🔔 Leads (Live)' },
  { to: '/admin/orders', label: '📦 Orders' },
  { to: '/admin/products', label: '🫙 Products' },
  { to: '/admin/categories', label: '🗂️ Categories' },
  { to: '/admin/flow-images', label: '🖼️ Flow Images' },
  { to: '/admin/supply-countries', label: '🌍 Supply Countries' },
  { to: '/crn', label: '💬 CRM' }
];

export default function AdminLayout() {
  const [authed, setAuthed] = useState(!!localStorage.getItem(ADMIN_TOKEN_KEY));
  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <aside style={{ width: 230, background: '#0f2417', color: '#fff', padding: 20, flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 24 }}>Devine</div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} style={({ isActive }) => ({
            display: 'block', padding: '10px 12px', borderRadius: 8, color: '#cfe8d6',
            textDecoration: 'none', marginBottom: 4, background: isActive ? '#1a7f37' : 'transparent'
          })}>{n.label}</NavLink>
        ))}
        <button onClick={() => { localStorage.removeItem(ADMIN_TOKEN_KEY); setAuthed(false); }}
          style={{ marginTop: 24, background: 'transparent', color: '#f6a', border: '1px solid #444', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', width: '100%' }}>Logout</button>
      </aside>
      <main style={{ flex: 1, background: '#fff', minWidth: 0 }}>
        <Routes>
          <Route index element={<Navigate to="/admin/leads" replace />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="products" element={<ProductsAdminPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="flow-images" element={<FlowImagesPage />} />
          <Route path="supply-countries" element={<SupplyCountriesPage />} />
        </Routes>
      </main>
    </div>
  );
}
