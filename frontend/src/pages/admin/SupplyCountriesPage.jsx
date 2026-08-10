import React, { useEffect, useState } from 'react';
import { api } from '../../adminApi';

export default function SupplyCountriesPage() {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [order, setOrder] = useState(0);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editOrder, setEditOrder] = useState(0);
  const [editFile, setEditFile] = useState(null);

  async function load() {
    const res = await api.get('/catalog/supply-countries?all=1');
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
      if (file) fd.append('logo', file);
      await api.postForm('/catalog/supply-countries', fd);
      setName(''); setFile(null); setOrder(0);
      await load();
    } finally { setBusy(false); }
  }

  function startEdit(c) {
    setEditId(c._id);
    setEditName(c.name);
    setEditOrder(c.order || 0);
    setEditFile(null);
  }

  async function saveEdit(id) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('name', editName);
      fd.append('order', editOrder);
      if (editFile) fd.append('logo', editFile);
      await api.putForm(`/catalog/supply-countries/${id}`, fd);
      setEditId(null);
      await load();
    } finally { setBusy(false); }
  }

  async function remove(id) {
    if (!confirm('Delete country?')) return;
    await api.del(`/catalog/supply-countries/${id}`);
    await load();
  }

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ marginTop: 0 }}>Supply Countries (Export)</h1>
      <p style={{ color: '#666' }}>Upload a 1:1 logo and country name. Shown in the Export flow (plus an "Enquiry" option).</p>

      <form onSubmit={add} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', background: '#fafafa', padding: 16, borderRadius: 12, marginBottom: 20 }}>
        <input required placeholder="Country name" value={name} onChange={(e) => setName(e.target.value)} style={input} />
        <input type="number" placeholder="Order" value={order} onChange={(e) => setOrder(e.target.value)} style={{ ...input, width: 90 }} />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        <button disabled={busy} style={btn}>Add</button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 16 }}>
        {list.map((c) => (
          <div key={c._id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 14, textAlign: 'center' }}>
            {c.logoUrl && <img src={c.logoUrl} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />}
            {editId === c._id ? (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} style={input} />
                <input type="number" value={editOrder} onChange={(e) => setEditOrder(e.target.value)} style={input} />
                <input type="file" accept="image/*" onChange={(e) => setEditFile(e.target.files[0])} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button disabled={busy} onClick={() => saveEdit(c._id)} style={{ ...btn, flex: 1 }}>Save</button>
                  <button onClick={() => setEditId(null)} style={{ ...btn, background: '#888', flex: 1 }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontWeight: 600, marginTop: 8 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: '#999' }}>Order: {c.order || 0}{c.active === false ? ' • inactive' : ''}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button onClick={() => startEdit(c)} style={{ ...btn, background: '#2563eb', flex: 1 }}>Edit</button>
                  <button onClick={() => remove(c._id)} style={{ ...btn, background: '#c0392b', flex: 1 }}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const input = { padding: 9, border: '1px solid #ddd', borderRadius: 6 };
const btn = { background: '#1a7f37', color: '#fff', border: 0, borderRadius: 6, padding: '9px 14px', cursor: 'pointer' };
