import React, { useEffect, useState } from 'react';
import { api } from '../../adminApi';

const empty = {
  name: '', category: '', shortDesc: '', description: '',
  price: '', mrp: '', dealerPrice: '', margin: '', moq: '', rating: '4.5'
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ProductsAdminPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [scheduleFor, setScheduleFor] = useState(null); // product being scheduled
  const [editing, setEditing] = useState(null); // product being edited

  async function load() {
    const [p, c] = await Promise.all([api.get('/products?all=1'), api.get('/catalog/categories?all=1')]);
    setProducts(p.data || []);
    setCategories(c.data || []);
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('image', file);
      await api.postForm('/products', fd);
      setMsg('Product added & synced to catalog');
      setForm(empty);
      setFile(null);
      await load();
    } catch (e) { setMsg(e.message); }
    setBusy(false);
  }

  async function remove(id) {
    if (!confirm('Delete this product? It will also be removed from the WhatsApp catalog.')) return;
    await api.del(`/products/${id}`);
    await load();
  }

  // Toggle manual out-of-stock (pause). isPaused=true => out of stock on WhatsApp.
  async function togglePaused(p) {
    await api.patch(`/products/${p._id}/availability`, { isPaused: !p.isPaused });
    await load();
  }

  async function syncCatalog() {
    setSyncing(true);
    setMsg('');
    try {
      const res = await api.post('/products/catalog/sync', {});
      setMsg(`Catalog synced: ${res.pushed} pushed, ${res.failed} failed of ${res.total}.`);
    } catch (e) { setMsg(`Sync failed: ${e.message}`); }
    setSyncing(false);
  }

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ marginTop: 0 }}>Products</h1>
        <button onClick={syncCatalog} disabled={syncing} style={{ ...btn, background: '#0b5' }}>
          {syncing ? 'Syncing…' : '↻ Sync WhatsApp Catalog'}
        </button>
      </div>
      {msg && <div style={{ background: '#e8f7ec', color: '#1a7f37', padding: 10, borderRadius: 8, marginBottom: 16 }}>{msg}</div>}

      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, background: '#fafafa', padding: 16, borderRadius: 12, marginBottom: 24 }}>
        <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={input} />
        <input list="cats" required placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={input} />
        <datalist id="cats">{categories.map((c) => <option key={c._id} value={c.name} />)}</datalist>
        <input placeholder="Short description" value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} style={input} />
        <input type="number" required placeholder="Price (MRP/B2C)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={input} />
        <input type="number" placeholder="MRP" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} style={input} />
        <input type="number" placeholder="Dealer price" value={form.dealerPrice} onChange={(e) => setForm({ ...form, dealerPrice: e.target.value })} style={input} />
        <input placeholder="Margin (e.g. 20-35%)" value={form.margin} onChange={(e) => setForm({ ...form, margin: e.target.value })} style={input} />
        <input placeholder="MOQ" value={form.moq} onChange={(e) => setForm({ ...form, moq: e.target.value })} style={input} />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        <button disabled={busy} style={btn}>{busy ? 'Saving…' : 'Add Product'}</button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 16 }}>
        {products.map((p) => {
          const outOfStock = p.isPaused || p.inStock === false || p.active === false;
          return (
            <div key={p._id} style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden', opacity: outOfStock ? 0.7 : 1 }}>
              {p.imageUrl && <img src={p.imageUrl} alt="" style={{ width: '100%', height: 140, objectFit: 'cover' }} />}
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div style={{ color: '#666', fontSize: 13 }}>{p.category}</div>
                <div style={{ marginTop: 6 }}>Rs.{p.price} {p.dealerPrice ? `| Dealer Rs.${p.dealerPrice}` : ''}</div>
                <div style={{ marginTop: 4, fontSize: 13, color: '#f59e0b' }}>
                  ⭐ {(p.avgRating || p.rating || 0).toFixed ? (p.avgRating || p.rating || 0).toFixed(1) : (p.avgRating || p.rating || 0)} ({p.totalRatings || p.reviewCount || 0})
                </div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: outOfStock ? '#c0392b' : '#1a7f37' }}>
                    {outOfStock ? 'OUT OF STOCK' : 'IN STOCK'}
                  </span>
                  {p.soldOutSchedule?.enabled && <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>⏱ scheduled</span>}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => setEditing(p)} style={{ ...miniBtn, background: '#111827' }}>Edit</button>
                  <button onClick={() => togglePaused(p)} style={{ ...miniBtn, background: p.isPaused ? '#1a7f37' : '#f59e0b' }}>
                    {p.isPaused ? 'Mark In Stock' : 'Mark Out of Stock'}
                  </button>
                  <button onClick={() => setScheduleFor(p)} style={{ ...miniBtn, background: '#2563eb' }}>Schedule</button>
                  <button onClick={() => remove(p._id)} style={{ ...miniBtn, background: '#c0392b' }}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {scheduleFor && (
        <ScheduleModal product={scheduleFor} onClose={() => setScheduleFor(null)} onSaved={() => { setScheduleFor(null); load(); }} />
      )}

      {editing && (
        <ProductEditModal
          product={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function ProductEditModal({ product, categories, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: product.name || '',
    category: product.category || '',
    shortDesc: product.shortDesc || '',
    description: product.description || '',
    price: product.price ?? '',
    mrp: product.mrp ?? '',
    dealerPrice: product.dealerPrice ?? '',
    margin: product.margin || '',
    moq: product.moq || '',
    badges: (product.badges || []).join(', ')
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('image', file);
      await api.putForm(`/products/${product._id}`, fd);
      onSaved();
    } catch (e2) {
      setErr(e2.message || 'Update failed');
      setSaving(false);
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <form style={modal} onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <h3 style={{ marginTop: 0 }}>Edit Product — {product.name}</h3>
        {err && <div style={{ background: '#fdecec', color: '#c0392b', padding: 10, borderRadius: 8, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 12 }}>
          {(file || product.imageUrl) && (
            <img
              src={file ? URL.createObjectURL(file) : product.imageUrl}
              alt=""
              style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }}
            />
          )}
          <label style={{ fontSize: 13, color: '#555' }}>
            Replace image
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} style={{ display: 'block', marginTop: 6 }} />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 }}>
          <input required placeholder="Name" value={form.name} onChange={set('name')} style={input} />
          <input list="edit-cats" required placeholder="Category" value={form.category} onChange={set('category')} style={input} />
          <datalist id="edit-cats">{categories.map((c) => <option key={c._id} value={c.name} />)}</datalist>
          <input type="number" required placeholder="Price (MRP/B2C)" value={form.price} onChange={set('price')} style={input} />
          <input type="number" placeholder="MRP" value={form.mrp} onChange={set('mrp')} style={input} />
          <input type="number" placeholder="Dealer price" value={form.dealerPrice} onChange={set('dealerPrice')} style={input} />
          <input placeholder="Margin (e.g. 20-35%)" value={form.margin} onChange={set('margin')} style={input} />
          <input placeholder="MOQ" value={form.moq} onChange={set('moq')} style={input} />
          <input placeholder="Badges (comma separated)" value={form.badges} onChange={set('badges')} style={input} />
        </div>
        <input placeholder="Short description" value={form.shortDesc} onChange={set('shortDesc')} style={{ ...input, width: '100%', marginTop: 10, boxSizing: 'border-box' }} />
        <textarea placeholder="Full description" value={form.description} onChange={set('description')} rows={4} style={{ ...input, width: '100%', marginTop: 10, boxSizing: 'border-box', resize: 'vertical' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button type="button" onClick={onClose} style={{ ...btn, background: '#888' }}>Cancel</button>
          <button type="submit" disabled={saving} style={btn}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
}

function ScheduleModal({ product, onClose, onSaved }) {
  const s = product.soldOutSchedule || {};
  const [enabled, setEnabled] = useState(!!s.enabled);
  const [type, setType] = useState(s.type || 'daily');
  const [dailyStart, setDailyStart] = useState(s.dailyStartTime || '09:00');
  const [dailyEnd, setDailyEnd] = useState(s.dailyEndTime || '22:00');
  const [days, setDays] = useState(
    DAYS.map((d) => {
      const found = (s.days || []).find((x) => x.day === d);
      return { day: d, enabled: found?.enabled || false, startTime: found?.startTime || '09:00', endTime: found?.endTime || '22:00' };
    })
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const soldOutSchedule = { enabled, type, dailyStartTime: dailyStart, dailyEndTime: dailyEnd, days };
    await api.patch(`/products/${product._id}/schedule`, { soldOutSchedule });
    setSaving(false);
    onSaved();
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Availability Schedule — {product.name}</h3>
        <p style={{ color: '#666', fontSize: 13 }}>
          Defines the window when the product is <b>available</b>. Outside the window it auto-switches to out of stock (checked every minute; syncs to WhatsApp).
        </p>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Enable schedule
        </label>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <label><input type="radio" checked={type === 'daily'} onChange={() => setType('daily')} /> Daily</label>
          <label><input type="radio" checked={type === 'custom'} onChange={() => setType('custom')} /> Per-day</label>
        </div>

        {type === 'daily' ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span>Available</span>
            <input type="time" value={dailyStart} onChange={(e) => setDailyStart(e.target.value)} style={input} />
            <span>to</span>
            <input type="time" value={dailyEnd} onChange={(e) => setDailyEnd(e.target.value)} style={input} />
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 6 }}>
            {days.map((d, i) => (
              <div key={d.day} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ width: 90 }}>
                  <input type="checkbox" checked={d.enabled} onChange={(e) => {
                    const nd = [...days]; nd[i] = { ...d, enabled: e.target.checked }; setDays(nd);
                  }} /> {d.day}
                </label>
                <input type="time" value={d.startTime} onChange={(e) => { const nd = [...days]; nd[i] = { ...d, startTime: e.target.value }; setDays(nd); }} style={input} />
                <span>to</span>
                <input type="time" value={d.endTime} onChange={(e) => { const nd = [...days]; nd[i] = { ...d, endTime: e.target.value }; setDays(nd); }} style={input} />
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ ...btn, background: '#888' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={btn}>{saving ? 'Saving…' : 'Save Schedule'}</button>
        </div>
      </div>
    </div>
  );
}

const input = { padding: 9, border: '1px solid #ddd', borderRadius: 6 };
const btn = { background: '#1a7f37', color: '#fff', border: 0, borderRadius: 6, padding: '9px 14px', cursor: 'pointer' };
const miniBtn = { color: '#fff', border: 0, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12 };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modal = { background: '#fff', borderRadius: 12, padding: 24, width: 'min(560px, 92vw)', maxHeight: '86vh', overflowY: 'auto' };
