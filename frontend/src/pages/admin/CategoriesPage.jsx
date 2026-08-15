import React, { useEffect, useState } from 'react';
import { api } from '../../adminApi';
import Loader from './Loader';
import { EditIcon, TrashIcon, IconBtn, ConfirmModal } from './adminUi';

// B2C browse categories (name + tile image)
export default function CategoriesPage() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null); // category being edited (null = new)
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get('/catalog/categories?all=1');
      setList(res.data || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (c) => { setEditing(c); setFormOpen(true); };

  if (loading) return <Loader />;

  return (
    <div style={{ padding: 28, fontFamily: 'SpotifyMixUI, Inter, sans-serif', color: '#ffffff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#ffffff' }}>Categories</h1>
          <p style={{ margin: '4px 0 0', color: '#b3b3b3', fontSize: 14 }}>Upload category name & tile image used across the storefront and WhatsApp catalog.</p>
        </div>
        <button onClick={openNew} style={btn}>+ Add Category</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 20, marginTop: 10 }}>
        {list.map((c) => (
          <div key={c._id}
            style={{ background: '#181818', border: '1px solid #282828', borderRadius: 14, overflow: 'hidden', opacity: c.active === false ? 0.6 : 1, boxShadow: 'rgba(0,0,0,0.35) 0px 6px 16px', transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.boxShadow = 'rgba(0,0,0,0.5) 0px 12px 28px'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#282828'; e.currentTarget.style.boxShadow = 'rgba(0,0,0,0.35) 0px 6px 16px'; }}
          >
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#ffffff' }}>
              {c.imageUrl ? (
                <img src={c.imageUrl} alt={c.name}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 12, boxSizing: 'border-box' }}
                  onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div style={{ display: c.imageUrl ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c7c7c', fontSize: 12, fontWeight: 600, background: '#252525', position: 'absolute', inset: 0 }}>No Image</div>
              {c.active === false && (
                <span style={{ position: 'absolute', top: 10, left: 10, fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 9999, textTransform: 'uppercase', letterSpacing: '0.8px', background: 'rgba(243,114,127,0.92)', color: '#0a0a0a' }}>Inactive</span>
              )}
              <div style={{ position: 'absolute', top: 8, right: 8 }}>
                <IconBtn icon={<EditIcon size={15} color="#ffffff" />} title="Edit category" onClick={() => openEdit(c)} />
              </div>
            </div>
            <div style={{ padding: '12px 14px', fontWeight: 700, fontSize: 15, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
          </div>
        ))}
        {list.length === 0 && <div style={{ color: '#b3b3b3', fontSize: 14 }}>No categories yet. Click "+ Add Category" above.</div>}
      </div>

      {formOpen && (
        <CategoryModal
          category={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); load(); }}
          onDeleted={() => { setFormOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function CategoryModal({ category, onClose, onSaved, onDeleted }) {
  const isEdit = !!category;
  const [name, setName] = useState(category?.name || '');
  const [active, setActive] = useState(category?.active !== false);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function doDelete() {
    setDeleting(true);
    try {
      await api.del(`/catalog/categories/${category._id}`);
      onDeleted ? onDeleted() : onClose();
    } catch (e) { setErr(e.message || 'Delete failed'); setDeleting(false); setConfirmDel(false); }
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('active', active ? 'true' : 'false');
      if (file) fd.append('image', file);
      if (isEdit) await api.putForm(`/catalog/categories/${category._id}`, fd);
      else await api.postForm('/catalog/categories', fd);
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
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#ffffff' }}>{isEdit ? 'Edit Category' : 'Add New Category'}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {isEdit && (
              <button type="button" title="Delete category" onClick={() => setConfirmDel(true)}
                style={{ background: 'rgba(243,114,127,0.14)', border: '1px solid rgba(243,114,127,0.4)', color: '#f3727f', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrashIcon size={15} color="#f3727f" />
              </button>
            )}
            <button type="button" onClick={onClose} style={{ background: '#282828', border: 0, color: '#b3b3b3', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}>✕</button>
          </div>
        </div>
        {confirmDel && (
          <ConfirmModal
            title="Delete this category?"
            message={`"${category.name}" will be removed from the storefront and WhatsApp catalog. This can't be undone.`}
            confirmText="Delete Category"
            busy={deleting}
            onConfirm={doDelete}
            onCancel={() => setConfirmDel(false)}
          />
        )}
        {err && <div style={{ background: 'rgba(243,114,127,0.15)', color: '#f3727f', padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{err}</div>}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#b3b3b3', fontWeight: 600, marginBottom: 8 }}>Category Tile Image</div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {(file || category?.imageUrl) ? (
              <img
                src={file ? URL.createObjectURL(file) : category.imageUrl}
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
                <span>{file ? 'Change File' : (category?.imageUrl ? 'Replace Image' : 'Choose Image')}</span>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} style={{ display: 'none' }} />
              </label>
              <span style={{ fontSize: 12, color: file ? '#1ed760' : '#7c7c7c' }}>
                {file ? file.name : 'PNG, JPG, WebP up to 10MB'}
              </span>
            </div>
          </div>
        </div>

        <label style={lbl}>Category Name *
          <input required placeholder="e.g. Organic Honey" value={name} onChange={(e) => setName(e.target.value)} style={{ ...input, width: '100%', boxSizing: 'border-box', marginTop: 6 }} />
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '16px 0 6px', color: '#ffffff', fontWeight: 600, fontSize: 13 }}>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active (visible on site & catalog)
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
          <button type="button" onClick={onClose} style={{ ...btn, background: 'transparent', color: '#f3727f', border: '1px solid rgba(243,114,127,0.4)' }}>Cancel</button>
          <button type="submit" disabled={saving} style={btn}>{saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Category')}</button>
        </div>
      </form>
    </div>
  );
}

const input = { padding: '9px 14px', background: '#1f1f1f', border: '1px solid #333', borderRadius: 500, color: '#ffffff', fontSize: 13, outline: 'none' };
const lbl = { display: 'block', fontSize: 13, color: '#b3b3b3', fontWeight: 600, marginBottom: 10 };
const btn = { background: '#1ed760', color: '#000000', border: 0, borderRadius: 9999, padding: '10px 18px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '1.4px', cursor: 'pointer' };
const miniBtn = { border: 0, borderRadius: 9999, padding: '5px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 };
const modal = { background: '#1f1f1f', border: '1px solid #282828', borderRadius: 12, padding: 24, width: 'min(480px, 92vw)', maxHeight: '86vh', overflowY: 'auto', color: '#ffffff', boxShadow: 'rgba(0,0,0,0.5) 0px 8px 24px' };


