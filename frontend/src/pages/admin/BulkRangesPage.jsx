import React, { useEffect, useState } from 'react';
import { api } from '../../adminApi';

// B2B bulk/wholesale ranges (name + MOQ + 1:1 tile image)
export default function BulkRangesPage() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null); // bulk range being edited (null = new)
  const [formOpen, setFormOpen] = useState(false);

  async function load() {
    const res = await api.get('/catalog/bulk-ranges?all=1');
    setList(res.data || []);
  }
  useEffect(() => { load(); }, []);

  async function remove(id) {
    if (!confirm('Delete this bulk range?')) return;
    await api.del(`/catalog/bulk-ranges/${id}`);
    await load();
  }

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (r) => { setEditing(r); setFormOpen(true); };

  return (
    <div style={{ padding: 28, fontFamily: 'SpotifyMixUI, Inter, sans-serif', color: '#ffffff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#ffffff' }}>Bulk / Wholesale Ranges</h1>
          <p style={{ margin: '4px 0 0', color: '#b3b3b3', fontSize: 14 }}>Add product ranges with MOQ and 1:1 tile images for B2B wholesale.</p>
        </div>
        <button onClick={openNew} style={btn}>+ Add Range</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 18, marginTop: 10 }}>
        {list.map((r) => (
          <div key={r._id} style={{ background: '#181818', border: '1px solid #282828', borderRadius: 8, padding: 14, textAlign: 'center', opacity: r.active === false ? 0.6 : 1, boxShadow: 'rgba(0,0,0,0.3) 0px 8px 8px', transition: 'transform 0.2s ease, background 0.2s ease' }}>
            <div style={{ width: '100%', aspectRatio: '1 / 1', background: '#ffffff', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, position: 'relative', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}>
              {r.imageUrl ? (
                <img
                  src={r.imageUrl}
                  alt={r.name}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div style={{ display: r.imageUrl ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#7c7c7c', fontSize: 12, fontWeight: 600, background: '#252525', position: 'absolute', inset: 0 }}>
                <span>No Image</span>
              </div>
            </div>
            <div style={{ fontWeight: 700, marginTop: 12, fontSize: 15, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
            {r.moq && <div style={{ fontSize: 12, color: '#b3b3b3', marginTop: 2 }}>{r.moq}</div>}
            {r.active === false && <div style={{ fontSize: 11, color: '#f3727f', marginTop: 2, fontWeight: 600 }}>Hidden</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'center' }}>
              <button onClick={() => openEdit(r)} style={{ ...miniBtn, background: '#282828', color: '#ffffff', flex: 1 }}>Edit</button>
              <button onClick={() => remove(r._id)} style={{ ...miniBtn, background: 'transparent', color: '#f3727f', border: '1px solid rgba(243,114,127,0.4)', flex: 1 }}>Delete</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <div style={{ color: '#b3b3b3', fontSize: 14 }}>No ranges yet. Click "+ Add Range" above.</div>}
      </div>

      {formOpen && (
        <BulkRangeModal
          range={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function BulkRangeModal({ range, onClose, onSaved }) {
  const isEdit = !!range;
  const [name, setName] = useState(range?.name || '');
  const [moq, setMoq] = useState(range?.moq || '');
  const [active, setActive] = useState(range?.active !== false);
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
      if (isEdit) await api.putForm(`/catalog/bulk-ranges/${range._id}`, fd);
      else await api.postForm('/catalog/bulk-ranges', fd);
      onSaved();
    } catch (e2) {
      setErr(e2.message || 'Save failed');
      setSaving(false);
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <form style={modal} onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#ffffff' }}>{isEdit ? 'Edit Bulk Range' : 'Add Bulk Range'}</h3>
          <button type="button" onClick={onClose} style={{ background: '#282828', border: 0, color: '#b3b3b3', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}>✕</button>
        </div>
        {err && <div style={{ background: 'rgba(243,114,127,0.15)', color: '#f3727f', padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{err}</div>}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#b3b3b3', fontWeight: 600, marginBottom: 8 }}>Range Image (1:1 Aspect Ratio)</div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {(file || range?.imageUrl) ? (
              <img
                src={file ? URL.createObjectURL(file) : range.imageUrl}
                alt=""
                style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #333' }}
              />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: 8, background: '#252525', border: '1px dashed #4d4d4d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#7c7c7c' }}>
                No Image
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 16px',
                background: '#282828',
                color: '#ffffff',
                border: '1px solid #4d4d4d',
                borderRadius: 500,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                width: 'fit-content'
              }}>
                <span>{file ? 'Change File' : (range?.imageUrl ? 'Replace Image' : 'Choose Image')}</span>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} style={{ display: 'none' }} />
              </label>
              <span style={{ fontSize: 12, color: file ? '#1ed760' : '#7c7c7c' }}>
                {file ? file.name : 'PNG, JPG, WebP up to 10MB'}
              </span>
            </div>
          </div>
        </div>

        <label style={lbl}>Range Name *
          <input required placeholder="e.g. Honey Range" value={name} onChange={(e) => setName(e.target.value)} style={{ ...input, width: '100%', boxSizing: 'border-box', marginTop: 6 }} />
        </label>
        <label style={{ ...lbl, marginTop: 12 }}>MOQ
          <input placeholder="e.g. MOQ 50/variant" value={moq} onChange={(e) => setMoq(e.target.value)} style={{ ...input, width: '100%', boxSizing: 'border-box', marginTop: 6 }} />
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '16px 0 6px', color: '#ffffff', fontWeight: 600, fontSize: 13 }}>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active (visible in flow)
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
          <button type="button" onClick={onClose} style={{ ...btn, background: 'transparent', color: '#f3727f', border: '1px solid rgba(243,114,127,0.4)' }}>Cancel</button>
          <button type="submit" disabled={saving} style={btn}>{saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Range')}</button>
        </div>
      </form>
    </div>
  );
}

const input = { padding: '9px 14px', background: '#1f1f1f', border: '1px solid #333', borderRadius: 500, color: '#ffffff', fontSize: 13, outline: 'none' };
const lbl = { display: 'block', fontSize: 13, color: '#b3b3b3', fontWeight: 600, marginBottom: 6 };
const btn = { background: '#1ed760', color: '#000000', border: 0, borderRadius: 9999, padding: '10px 18px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '1.4px', cursor: 'pointer' };
const miniBtn = { border: 0, borderRadius: 9999, padding: '5px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 };
const modal = { background: '#1f1f1f', border: '1px solid #282828', borderRadius: 12, padding: 24, width: 'min(480px, 92vw)', maxHeight: '86vh', overflowY: 'auto', color: '#ffffff', boxShadow: 'rgba(0,0,0,0.5) 0px 8px 24px' };


