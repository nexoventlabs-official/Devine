import React, { useEffect, useState } from 'react';
import { api } from '../../adminApi';

// B2C browse categories (name + tile image shown in the WhatsApp category list).
export default function CategoriesPage() {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [order, setOrder] = useState(0);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await api.get('/catalog/categories?all=1');
    setList(res.data || []);
  }
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('order', order);
      if (file) fd.append('image', file);
      await api.postForm('/catalog/categories', fd);
      setName(''); setFile(null); setOrder(0);
      await load();
    } finally { setBusy(false); }
  }

  async function remove(id) {
    if (!confirm('Delete category?')) return;
    await api.del(`/catalog/categories/${id}`);
    await load();
  }

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ marginTop: 0 }}>Categories</h1>
      <p style={{ color: '#666' }}>Upload a category name + tile image. Used in the B2C "Browse products" flow.</p>
      <form onSubmit={add} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', background: '#fafafa', padding: 16, borderRadius: 12, marginBottom: 20 }}>
        <input required placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} style={input} />
        <input type="number" placeholder="Order" value={order} onChange={(e) => setOrder(e.target.value)} style={{ ...input, width: 90 }} />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        <button disabled={busy} style={btn}>Add</button>
      </form>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 16 }}>
        {list.map((c) => (
          <div key={c._id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 14, textAlign: 'center' }}>
            {c.imageUrl && <img src={c.imageUrl} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8 }} />}
            <div style={{ fontWeight: 600, marginTop: 8 }}>{c.name}</div>
            <button onClick={() => remove(c._id)} style={{ ...btn, background: '#c0392b', marginTop: 8 }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const input = { padding: 9, border: '1px solid #ddd', borderRadius: 6 };
const btn = { background: '#1a7f37', color: '#fff', border: 0, borderRadius: 6, padding: '9px 14px', cursor: 'pointer' };
