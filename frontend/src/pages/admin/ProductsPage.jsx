import React, { useEffect, useState } from 'react';
import { api } from '../../adminApi';

const empty = {
  name: '', category: '', shortDesc: '', description: '',
  price: '', mrp: '', dealerPrice: '', margin: '', moq: '', rating: '4.5'
};

export default function ProductsAdminPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

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
      setMsg('Product added');
      setForm(empty);
      setFile(null);
      await load();
    } catch (e) { setMsg(e.message); }
    setBusy(false);
  }

  async function remove(id) {
    if (!confirm('Delete this product?')) return;
    await api.del(`/products/${id}`);
    await load();
  }

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ marginTop: 0 }}>Products</h1>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
        {products.map((p) => (
          <div key={p._id} style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
            {p.imageUrl && <img src={p.imageUrl} alt="" style={{ width: '100%', height: 140, objectFit: 'cover' }} />}
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div style={{ color: '#666', fontSize: 13 }}>{p.category}</div>
              <div style={{ marginTop: 6 }}>Rs.{p.price} {p.dealerPrice ? `| Dealer Rs.${p.dealerPrice}` : ''}</div>
              <button onClick={() => remove(p._id)} style={{ ...btn, background: '#c0392b', marginTop: 8 }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const input = { padding: 9, border: '1px solid #ddd', borderRadius: 6 };
const btn = { background: '#1a7f37', color: '#fff', border: 0, borderRadius: 6, padding: '9px 14px', cursor: 'pointer' };
