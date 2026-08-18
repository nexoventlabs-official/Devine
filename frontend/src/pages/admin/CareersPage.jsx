import React, { useEffect, useState } from 'react';
import { api } from '../../adminApi';
import Loader from './Loader';
import { TrashIcon, ConfirmModal } from './adminUi';

const STATUSES = ['New', 'Reviewed', 'Shortlisted', 'Rejected'];
const STATUS_COLOR = {
  New: '#1ed760', Reviewed: '#539df5', Shortlisted: '#ffa42b', Rejected: '#f3727f'
};

export default function CareersPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDel, setConfirmDel] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      const res = await api.get('/careers');
      setList(res.data || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function setStatus(id, status) {
    await api.patch(`/careers/${id}/status`, { status });
    setList((l) => l.map((c) => (c._id === id ? { ...c, status } : c)));
  }
  async function doDelete() {
    setDeleting(true);
    try { await api.del(`/careers/${confirmDel._id}`); setList((l) => l.filter((c) => c._id !== confirmDel._id)); setConfirmDel(null); }
    catch (e) { alert(e.message); } finally { setDeleting(false); }
  }

  if (loading) return <Loader />;

  return (
    <div style={{ padding: 28, fontFamily: 'SpotifyMixUI, Inter, sans-serif', color: '#ffffff' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Careers</h2>
        <p style={{ color: '#b3b3b3', fontSize: 13, marginTop: 4 }}>Job applications submitted from the website. {list.length} total.</p>
      </div>

      {list.length === 0 ? (
        <div style={{ color: '#b3b3b3', fontSize: 14 }}>No applications yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {list.map((c) => (
            <div key={c._id} style={{ background: '#181818', border: '1px solid #282828', borderRadius: 12, padding: 18, boxShadow: 'rgba(0,0,0,0.3) 0px 8px 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>{c.fullName}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 9999, background: `${STATUS_COLOR[c.status] || '#7c7c7c'}22`, color: STATUS_COLOR[c.status] || '#b3b3b3', border: `1px solid ${STATUS_COLOR[c.status] || '#7c7c7c'}55` }}>{c.status}</span>
                  </div>
                  <div style={{ color: '#1ed760', fontSize: 13, fontWeight: 600, marginTop: 4 }}>{c.roleApplied}</div>
                  <div style={{ color: '#b3b3b3', fontSize: 13, marginTop: 6, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <a href={`tel:${c.phone}`} style={{ color: '#e0e0e0' }}>📞 {c.phone}</a>
                    <a href={`mailto:${c.email}`} style={{ color: '#e0e0e0' }}>✉️ {c.email}</a>
                    <span>🧭 {c.experience}</span>
                  </div>
                  {c.coverNote && <div style={{ color: '#b3b3b3', fontSize: 13, marginTop: 10, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{c.coverNote}</div>}
                  <div style={{ color: '#7c7c7c', fontSize: 11, marginTop: 8 }}>{c.createdAt ? new Date(c.createdAt).toLocaleString('en-IN') : ''}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <select value={c.status} onChange={(e) => setStatus(c._id, e.target.value)} style={selectStyle}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button type="button" title="Delete" onClick={() => setConfirmDel(c)} style={delBtn}><TrashIcon size={15} color="#f3727f" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDel && (
        <ConfirmModal
          title="Delete this application?"
          message={`"${confirmDel.fullName}"'s application will be permanently removed.`}
          confirmText="Delete"
          busy={deleting}
          onConfirm={doDelete}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}

const selectStyle = { padding: '7px 12px', background: '#1f1f1f', color: '#fff', border: '1px solid #333', borderRadius: 500, outline: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' };
const delBtn = { background: 'rgba(243,114,127,0.14)', border: '1px solid rgba(243,114,127,0.4)', color: '#f3727f', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
