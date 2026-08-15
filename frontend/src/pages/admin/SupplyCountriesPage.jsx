import React, { useEffect, useState } from 'react';
import { api } from '../../adminApi';

// Export supply countries (country name, logo, order)
export default function SupplyCountriesPage() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null); // country being edited (null = new)
  const [formOpen, setFormOpen] = useState(false);

  async function load() {
    const res = await api.get('/catalog/supply-countries?all=1');
    setList(res.data || []);
  }
  useEffect(() => { load(); }, []);

  async function remove(id) {
    if (!confirm('Delete country?')) return;
    await api.del(`/catalog/supply-countries/${id}`);
    await load();
  }

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (c) => { setEditing(c); setFormOpen(true); };

  return (
    <div style={{ padding: 28, fontFamily: 'SpotifyMixUI, Inter, sans-serif', color: '#ffffff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#ffffff' }}>Export Supply Countries</h1>
          <p style={{ margin: '4px 0 0', color: '#b3b3b3', fontSize: 14 }}>Manage target countries displayed in the Export Supply flow.</p>
        </div>
        <button onClick={openNew} style={btn}>+ Add Country</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 18, marginTop: 10 }}>
        {list.map((c) => (
          <div key={c._id} style={{ background: '#181818', border: '1px solid #282828', borderRadius: 8, padding: 16, textAlign: 'center', boxShadow: 'rgba(0,0,0,0.3) 0px 8px 8px' }}>
            {c.logoUrl ? (
              <img src={c.logoUrl} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '50%', border: '1px solid #333', margin: '0 auto 10px' }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#252525', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c7c7c', fontSize: 12, margin: '0 auto 10px' }}>Flag</div>
            )}
            <div style={{ fontWeight: 700, fontSize: 16, color: '#ffffff' }}>{c.name}</div>
            <div style={{ fontSize: 12, color: '#b3b3b3', marginTop: 2 }}>Order: {c.order || 0}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
              <button onClick={() => openEdit(c)} style={{ ...miniBtn, background: '#282828', color: '#ffffff' }}>Edit</button>
              <button onClick={() => remove(c._id)} style={{ ...miniBtn, background: 'transparent', color: '#f3727f', border: '1px solid rgba(243,114,127,0.4)' }}>Delete</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <div style={{ color: '#b3b3b3', fontSize: 14 }}>No supply countries yet. Click "+ Add Country" above.</div>}
      </div>

      {formOpen && (
        <SupplyCountryModal
          country={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function SupplyCountryModal({ country, onClose, onSaved }) {
  const isEdit = !!country;
  const [name, setName] = useState(country?.name || '');
  const [order, setOrder] = useState(country?.order || 0);
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
      fd.append('order', order);
      if (file) fd.append('logo', file);
      if (isEdit) await api.putForm(`/catalog/supply-countries/${country._id}`, fd);
      else await api.postForm('/catalog/supply-countries', fd);
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
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#ffffff' }}>{isEdit ? 'Edit Country' : 'Add Supply Country'}</h3>
          <button type="button" onClick={onClose} style={{ background: '#282828', border: 0, color: '#b3b3b3', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}>✕</button>
        </div>
        {err && <div style={{ background: 'rgba(243,114,127,0.15)', color: '#f3727f', padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{err}</div>}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#b3b3b3', fontWeight: 600, marginBottom: 8 }}>Country Flag / Logo Image</div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {(file || country?.logoUrl) ? (
              <img
                src={file ? URL.createObjectURL(file) : country.logoUrl}
                alt=""
                style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '50%', border: '1px solid #333' }}
              />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#252525', border: '1px dashed #4d4d4d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#7c7c7c' }}>
                Flag
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
                <span>{file ? 'Change File' : (country?.logoUrl ? 'Replace Flag' : 'Choose Flag')}</span>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} style={{ display: 'none' }} />
              </label>
              <span style={{ fontSize: 12, color: file ? '#1ed760' : '#7c7c7c' }}>
                {file ? file.name : 'PNG, JPG, WebP up to 10MB'}
              </span>
            </div>
          </div>
        </div>

        <label style={lbl}>Country Name *
          <input required placeholder="e.g. United Arab Emirates" value={name} onChange={(e) => setName(e.target.value)} style={{ ...input, width: '100%', boxSizing: 'border-box', marginTop: 6 }} />
        </label>
        <label style={{ ...lbl, marginTop: 12 }}>Display Order
          <input type="number" value={order} onChange={(e) => setOrder(e.target.value)} style={{ ...input, width: '100%', boxSizing: 'border-box', marginTop: 6 }} />
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
          <button type="button" onClick={onClose} style={{ ...btn, background: 'transparent', color: '#f3727f', border: '1px solid rgba(243,114,127,0.4)' }}>Cancel</button>
          <button type="submit" disabled={saving} style={btn}>{saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Add Country')}</button>
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


