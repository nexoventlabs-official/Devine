import React, { useEffect, useState } from 'react';
import { api } from '../../adminApi';

// B2C browse categories (name + tile image shown in the WhatsApp category list
// and in the website home-page category marquee).
export default function CategoriesPage() {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null); // category being edited

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
      if (file) fd.append('image', file);
      await api.postForm('/catalog/categories', fd);
      setName(''); setFile(null);
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
      <p style={{ color: '#666' }}>Upload a category name + tile image. Used in the B2C "Browse products" flow and the website category strip.</p>
      <form onSubmit={add} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', background: '#fafafa', padding: 16, borderRadius: 12, marginBottom: 20 }}>
        <input required placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} style={input} />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        <button disabled={busy} style={btn}>Add</button>
      </form>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 16 }}>
        {list.map((c) => (
          <div key={c._id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 14, textAlign: 'center' }}>
            {c.imageUrl && <img src={c.imageUrl} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8 }} />}
            <div style={{ fontWeight: 600, marginTop: 8 }}>{c.name}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'center' }}>
              <button onClick={() => setEditing(c)} style={{ ...btn, background: '#111827', padding: '7px 12px' }}>Edit</button>
              <button onClick={() => remove(c._id)} style={{ ...btn, background: '#c0392b', padding: '7px 12px' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <CategoryEditModal
          category={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function CategoryEditModal({ category, onClose, onSaved }) {
  const [name, setName] = useState(category.name || '');
  const [active, setActive] = useState(category.active !== false);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('active', active ? 'true' : 'false');
      if (file) fd.append('image', file);
      await api.putForm(`/catalog/categories/${category._id}`, fd);
      onSaved();
    } catch (e2) {
      setErr(e2.message || 'Update failed');
      setSaving(false);
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <form style={modal} onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <h3 style={{ marginTop: 0 }}>Edit Category</h3>
        {err && <div style={{ background: '#fdecec', color: '#c0392b', padding: 10, borderRadius: 8, marginBottom: 12 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 14 }}>
          {(file || category.imageUrl) && (
            <img
              src={file ? URL.createObjectURL(file) : category.imageUrl}
              alt=""
              style={{ width: 110, height: 110, objectFit: 'cover', borderRadius: 10, border: '1px solid #eee' }}
            />
          )}
          <label style={{ fontSize: 13, color: '#555' }}>
            Replace image
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} style={{ display: 'block', marginTop: 6 }} />
          </label>
        </div>

        <label style={lbl}>Name
          <input required value={name} onChange={(e) => setName(e.target.value)} style={{ ...input, width: '100%', boxSizing: 'border-box' }} />
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '10px 0' }}>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active (visible on site & flow)
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={{ ...btn, background: '#888' }}>Cancel</button>
          <button type="submit" disabled={saving} style={btn}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
}

const input = { padding: 9, border: '1px solid #ddd', borderRadius: 6 };
const lbl = { display: 'block', fontSize: 13, color: '#555', marginBottom: 10 };
const btn = { background: '#1a7f37', color: '#fff', border: 0, borderRadius: 6, padding: '9px 14px', cursor: 'pointer' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modal = { background: '#fff', borderRadius: 12, padding: 24, width: 'min(480px, 92vw)', maxHeight: '86vh', overflowY: 'auto' };
