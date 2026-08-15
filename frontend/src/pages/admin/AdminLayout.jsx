import React, { useState } from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { API_BASE_URL, ADMIN_TOKEN_KEY } from '../../config';
import ProductsAdminPage from './ProductsPage';
import CategoriesPage from './CategoriesPage';
import FlowImagesPage from './FlowImagesPage';
import SupplyCountriesPage from './SupplyCountriesPage';
import BulkRangesPage from './BulkRangesPage';
import OffersPage from './OffersPage';
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
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#121212', color: '#ffffff', fontFamily: 'SpotifyMixUI, Inter, sans-serif' }}>
      <form onSubmit={submit} style={{ width: 360, padding: 32, background: '#181818', border: '1px solid #282828', borderRadius: 12, boxShadow: 'rgba(0,0,0,0.5) 0px 8px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src="/assets/logo.svg" alt="Devine Logo" style={{ height: 42, marginBottom: 12 }} />
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#ffffff' }}>Devine Admin</h2>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.4px', color: '#1ed760', textTransform: 'uppercase' }}>Control Center</span>
        </div>
        {err && <div style={{ background: 'rgba(243,114,127,0.15)', color: '#f3727f', padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 600 }}>{err}</div>}
        <input placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} style={inp} />
        <input placeholder="Password" type="password" value={p} onChange={(e) => setP(e.target.value)} style={inp} />
        <button style={{ width: '100%', padding: '12px 16px', background: '#1ed760', color: '#000', border: 0, borderRadius: 9999, fontWeight: 700, fontSize: 13, letterSpacing: '1.4px', textTransform: 'uppercase', cursor: 'pointer' }}>Sign in</button>
      </form>
    </div>
  );
}

const inp = { width: '100%', padding: 12, marginBottom: 14, background: '#1f1f1f', border: '1px solid #333', borderRadius: 500, color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none' };

const NAV = [
  { to: '/admin/leads', label: 'Leads (Live)' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/bulk-ranges', label: 'Bulk Ranges' },
  { to: '/admin/offers', label: 'Offers' },
  { to: '/admin/flow-images', label: 'Flow Images' },
  { to: '/admin/supply-countries', label: 'Supply Countries' },
  { to: '/crn', label: 'CRM' }
];

export default function AdminLayout() {
  const [authed, setAuthed] = useState(!!localStorage.getItem(ADMIN_TOKEN_KEY));
  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#121212', color: '#ffffff', fontFamily: 'SpotifyMixUI, Inter, sans-serif' }}>
      <aside style={{
        width: 240,
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        background: '#121212',
        borderRight: '1px solid #282828',
        color: '#ffffff',
        padding: '24px 16px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflowY: 'auto',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, paddingLeft: 8 }}>
          <img src="/assets/logo.svg" alt="Devine" style={{ height: 32 }} />
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '1.5px', color: '#1ed760', textTransform: 'uppercase' }}>ADMIN</span>
        </div>
        <div style={{ flex: 1 }}>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} style={({ isActive }) => ({
              display: 'block', padding: '10px 16px', borderRadius: 9999, color: isActive ? '#000000' : '#b3b3b3',
              textDecoration: 'none', marginBottom: 6, fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '1.2px',
              background: isActive ? '#1ed760' : 'transparent', transition: 'all 0.2s ease'
            })}>{n.label}</NavLink>
          ))}
        </div>
        <button onClick={() => { localStorage.removeItem(ADMIN_TOKEN_KEY); setAuthed(false); }}
          style={{ marginTop: 24, background: 'transparent', color: '#ffffff', border: '1px solid #7c7c7c', borderRadius: 9999, padding: '10px 16px', cursor: 'pointer', width: '100%', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '1.4px' }}>Logout</button>
      </aside>
      <main style={{ flex: 1, height: '100vh', overflowY: 'auto', background: '#121212', color: '#ffffff', minWidth: 0, boxSizing: 'border-box' }}>
        <Routes>
          <Route index element={<Navigate to="/admin/leads" replace />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="products" element={<ProductsAdminPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="bulk-ranges" element={<BulkRangesPage />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="flow-images" element={<FlowImagesPage />} />
          <Route path="supply-countries" element={<SupplyCountriesPage />} />
        </Routes>
      </main>
    </div>
  );
}

