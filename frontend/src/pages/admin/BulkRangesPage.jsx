import React, { useEffect, useState } from 'react';
import { api } from '../../adminApi';

// B2B bulk/wholesale ranges (name + MOQ + 1:1 tile image). These appear as radio
// options with logos inside the Choose Service -> Bulk / Wholesale flow.
export default function BulkRangesPage() {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [moq, setMoq] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    const res = await api.get('/catalog/bulk-ranges?all=1');
    setList(res.data || []);
  }
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('moq', moq);
      if (file) fd.append('image', file);
      await api.postForm('/catalog/bulk-ranges', fd);
      setName(''); setMoq(''); setFile(null);
      await load();
    } finally { setBusy(false); }
  }

  async function remove(id) {
    if (!confirm('Delete this bulk range? Its image is removed from Cloudinary too.')) return;
    await api.del(`/catalog/bulk-ranges/${id}`);
    await load();
  }

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ marginTop: 0 }}>Bulk / Wholesale Ranges</h1>
      <p style={{ color: '#666' }}>Add product ranges with a MOQ and a 1:1 logo. These show as options in the WhatsApp Bulk / Wholesale flow.</p>

      <form onSubmit={add} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', background: '#fafafa', padding: 16, borderRadius: 12, marginBottom: 20 }}>
        <input required placeholder="Range name (e.g. Honey Range)" value={name} onChange={(e) => setName(e.target.value)} style={input} />
        <input placeholder="MOQ (e.g. MOQ 50/variant)" value={moq} onChange={(e) => setMoq(e.target.value)} style={input} />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        <button disabled={busy} style={btn}>{busy ? 'Saving…' : 'Add'}</button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 16 }}>
        {list.map((r) => (
          <div key={r._id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 14, textAlign: 'center', opacity: r.active === false ? 0.6 : 1 }}>
            {r.imageUrl && <img src={r.imageUrl} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 8 }} />}
            <div style={{ fontWeight: 700, marginTop: 8 }}>{r.name}</div>
            {r.moq && <div style={{ fontSize: 12, color: '#888' }}>{r.moq}</div>}
            {r.active === false && <div style={{ fontSize: 11, color: '#aaa' }}>hidden</div>}
            <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'center' }}>
              <button onClick={() => setEditing(r)} style={{ ...btn, background: '#111827', padding: '7px 12px' }}>Edit</button>
              <button onClick={() => remove(r._id)} style={{ ...btn, background: '#c0392b', padding: '7px 12px' }}>Delete</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <div style={{ color: '#888' }}>No ranges yet. Add one above.</div>}
      </div>

      {editing && (
        <BulkRangeEditModal range={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

function BulkRangeEditModal({ range, onClose, onSaved }) {
  const [name, setName] = useState(range.name || '');
  const [moq, setMoq] = useState(range.moq || '');
  const [active, setActive] = useState(range.active !== false);
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
      fd.append('moq', moq);
      fd.append('active', active ? 'true' : 'false');
      if (file) fd.append('image', file);
      await api.putForm(`/catalog/bulk-ranges/${range._id}`, fd);
      onSaved();
    } catch (e2) {
      setErr(e2.message || 'Update failed');
      setSaving(false);
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <form style={modal} onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <h3 style={{ marginTop: 0 }}>Edit Bulk Range</h3>
        {err && <div style={{ background: '#fdecec', color: '#c0392b', padding: 10, borderRadius: 8, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 14 }}>
          {(file || range.imageUrl) && (
            <img src={file ? URL.createObjectURL(file) : range.imageUrl} alt="" style={{ width: 110, height: 110, objectFit: 'cover', borderRadius: 10, border: '1px solid #eee' }} />
          )}
          <label style={{ fontSize: 13, color: '#555' }}>
            Replace image (1:1)
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} style={{ display: 'block', marginTop: 6 }} />
          </label>
        </div>
        <label style={lbl}>Name
          <input required value={name} onChange={(e) => setName(e.target.value)} style={{ ...input, width: '100%', boxSizing: 'border-box' }} />
        </label>
        <label style={lbl}>MOQ
          <input value={moq} onChange={(e) => setMoq(e.target.value)} style={{ ...input, width: '100%', boxSizing: 'border-box' }} />
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '10px 0' }}>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active (visible in flow)
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
