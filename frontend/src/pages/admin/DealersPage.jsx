import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../adminApi';
import Loader from './Loader';
import { TrashIcon, ConfirmModal } from './adminUi';

export default function DealersPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | website | whatsapp
  const [confirmDel, setConfirmDel] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      const res = await api.get('/dealers');
      setList(res.data || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function toggleStatus(d) {
    const status = d.status === 'Active' ? 'Inactive' : 'Active';
    await api.patch(`/dealers/${d._id}/status`, { status });
    setList((l) => l.map((x) => (x._id === d._id ? { ...x, status } : x)));
  }
  async function doDelete() {
    setDeleting(true);
    try { await api.del(`/dealers/${confirmDel._id}`); setList((l) => l.filter((x) => x._id !== confirmDel._id)); setConfirmDel(null); }
    catch (e) { alert(e.message); } finally { setDeleting(false); }
  }

  const sourceOf = (d) => (d.source === 'website' ? 'website' : 'whatsapp');
  const filtered = useMemo(() => list.filter((d) => filter === 'all' || sourceOf(d) === filter), [list, filter]);
  const counts = useMemo(() => ({
    all: list.length,
    website: list.filter((d) => sourceOf(d) === 'website').length,
    whatsapp: list.filter((d) => sourceOf(d) === 'whatsapp').length
  }), [list]);

  if (loading) return <Loader />;

  const pill = (key, label) => (
    <button onClick={() => setFilter(key)} style={{
      padding: '7px 16px', borderRadius: 9999, border: '1px solid #333', cursor: 'pointer', fontSize: 12, fontWeight: 700,
      background: filter === key ? '#1ed760' : '#1f1f1f', color: filter === key ? '#000' : '#b3b3b3'
    }}>{label} ({counts[key]})</button>
  );

  return (
    <div style={{ padding: 28, fontFamily: 'SpotifyMixUI, Inter, sans-serif', color: '#ffffff' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Dealers</h2>
        <p style={{ color: '#b3b3b3', fontSize: 13, marginTop: 4 }}>Registered dealers from the website and WhatsApp.</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {pill('all', 'All')}{pill('website', 'Website')}{pill('whatsapp', 'WhatsApp')}
      </div>

      {filtered.length === 0 ? (
        <div style={{ color: '#b3b3b3', fontSize: 14 }}>No dealers found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {filtered.map((d) => {
            const web = sourceOf(d) === 'website';
            const active = d.status === 'Active';
            return (
              <div key={d._id} style={{ background: '#181818', border: '1px solid #282828', borderRadius: 12, padding: 18, boxShadow: 'rgba(0,0,0,0.3) 0px 8px 8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#1ed760', fontWeight: 700 }}>{d.dealerId || '—'}</div>
                    <div style={{ fontWeight: 800, fontSize: 16, marginTop: 2 }}>{d.businessName || d.name || '—'}</div>
                    {d.name && d.businessName && <div style={{ color: '#b3b3b3', fontSize: 12 }}>{d.name}</div>}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 9999, textTransform: 'uppercase', letterSpacing: '0.6px', flexShrink: 0, background: web ? 'rgba(83,157,245,0.15)' : 'rgba(37,211,102,0.15)', color: web ? '#539df5' : '#25D366', border: `1px solid ${web ? 'rgba(83,157,245,0.4)' : 'rgba(37,211,102,0.4)'}` }}>{web ? 'Website' : 'WhatsApp'}</span>
                </div>

                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: '#e0e0e0' }}>
                  <div><span style={{ color: '#7c7c7c' }}>Phone:</span> <a href={`https://wa.me/${d.phone}`} target="_blank" rel="noreferrer" style={{ color: '#e0e0e0' }}>{d.phone}</a></div>
                  {d.businessType && <div><span style={{ color: '#7c7c7c' }}>Type:</span> {d.businessType}</div>}
                  <div><span style={{ color: '#7c7c7c' }}>Location:</span> {[d.city, d.district, d.state].filter(Boolean).join(', ') || '—'}</div>
                  {d.capacity && <div><span style={{ color: '#7c7c7c' }}>Capacity:</span> {d.capacity}</div>}
                  {(d.areaManagerName || d.areaManagerPhone) && <div><span style={{ color: '#7c7c7c' }}>Manager:</span> {d.areaManagerName} {d.areaManagerPhone ? `(${d.areaManagerPhone})` : ''}</div>}
                  <div style={{ color: '#7c7c7c', fontSize: 11 }}>{d.createdAt ? new Date(d.createdAt).toLocaleString('en-IN') : ''}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
                  <button onClick={() => toggleStatus(d)} style={{
                    flex: 1, padding: '8px 12px', borderRadius: 9999, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    border: `1px solid ${active ? 'rgba(30,215,96,0.4)' : 'rgba(243,114,127,0.4)'}`,
                    background: active ? 'rgba(30,215,96,0.12)' : 'rgba(243,114,127,0.12)', color: active ? '#1ed760' : '#f3727f'
                  }}>{active ? 'Active' : 'Inactive'} · tap to toggle</button>
                  <button type="button" title="Delete" onClick={() => setConfirmDel(d)} style={delBtn}><TrashIcon size={15} color="#f3727f" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmDel && (
        <ConfirmModal
          title="Delete this dealer?"
          message={`${confirmDel.dealerId || ''} — ${confirmDel.businessName || confirmDel.name || 'this dealer'} will be removed. On WhatsApp they'll see "Become a Dealer" again.`}
          confirmText="Delete Dealer"
          busy={deleting}
          onConfirm={doDelete}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}

const delBtn = { background: 'rgba(243,114,127,0.14)', border: '1px solid rgba(243,114,127,0.4)', color: '#f3727f', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
