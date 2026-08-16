import React, { useEffect, useState } from 'react';
import { api } from '../../adminApi';
import Loader from './Loader';

// Admin offers: pick products, set a B2C and/or B2B discount.
export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null); // offer being edited (null = none)
  const [creating, setCreating] = useState(false);

  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [o, p] = await Promise.all([api.get('/catalog/offers'), api.get('/products?all=1')]);
      setOffers(o.data || []);
      setProducts(p.data || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function remove(id) {
    if (!confirm('Delete this offer? Prices revert to normal.')) return;
    await api.del(`/catalog/offers/${id}`);
    await load();
  }

  const fmtRule = (r) => (r?.enabled ? (r.type === 'flat' ? `₹${r.value} off` : `${r.value}% off`) : '—');

  if (loading) return <Loader />;

  return (
    <div style={{ padding: 28, fontFamily: 'SpotifyMixUI, Inter, sans-serif', color: '#ffffff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 4, fontSize: 24, fontWeight: 700, color: '#ffffff' }}>Offers & Discounts</h1>
          <p style={{ margin: 0, color: '#b3b3b3', fontSize: 14 }}>Create B2C & B2B promotional discounts across products.</p>
        </div>
        <button onClick={() => setCreating(true)} style={btn}>+ Create Offer</button>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {offers.map((o) => {
          const prods = (o.productIds || []).map(p => (typeof p === 'object' ? p : products.find(x => x._id === p))).filter(Boolean);
          return (
            <div key={o._id} style={{ background: '#181818', border: '1px solid #282828', borderRadius: 8, padding: 18, boxShadow: 'rgba(0,0,0,0.3) 0px 8px 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#ffffff' }}>
                    {o.title} {o.active ? <span style={pill('rgba(30, 215, 96, 0.15)', '#1ed760', 'rgba(30, 215, 96, 0.3)')}>Active</span> : <span style={pill('rgba(243, 114, 127, 0.15)', '#f3727f', 'rgba(243, 114, 127, 0.3)')}>Off</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#b3b3b3', marginTop: 4 }}>
                    B2C: <strong style={{ color: '#1ed760' }}>{fmtRule(o.b2c)}</strong> · B2B: <strong style={{ color: '#539df5' }}>{fmtRule(o.b2b)}</strong> · {prods.length} product(s)
                  </div>
                  
                  {/* Product Thumbnails Row */}
                  {prods.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      {prods.slice(0, 6).map((p) => (
                        <div key={p._id} title={p.name} style={{ width: 44, height: 44, background: '#ffffff', borderRadius: 6, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 3, border: '1px solid #333' }}>
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <span style={{ fontSize: 9, color: '#7c7c7c' }}>Item</span>
                          )}
                        </div>
                      ))}
                      {prods.length > 6 && (
                        <div style={{ fontSize: 12, color: '#b3b3b3', fontWeight: 600 }}>+{prods.length - 6} more</div>
                      )}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#7c7c7c', marginTop: 6 }}>
                    {prods.map((p) => p.name).join(', ') || 'No products selected'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setEditing(o)} style={{ ...miniBtn, background: '#282828', color: '#ffffff' }}>Edit</button>
                  <button onClick={() => remove(o._id)} style={{ ...miniBtn, background: 'transparent', color: '#f3727f', border: '1px solid rgba(243,114,127,0.4)' }}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}
        {offers.length === 0 && <div style={{ color: '#b3b3b3', fontSize: 14 }}>No offers yet. Create one above.</div>}
      </div>

      {(creating || editing) && (
        <OfferModal
          offer={editing}
          products={products}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function OfferModal({ offer, products, onClose, onSaved }) {
  const isEdit = !!offer;
  const [title, setTitle] = useState(offer?.title || '');
  const [active, setActive] = useState(offer?.active !== false);
  const [b2c, setB2c] = useState({ enabled: offer?.b2c?.enabled ?? true, type: offer?.b2c?.type || 'percent', value: offer?.b2c?.value ?? '' });
  const [b2b, setB2b] = useState({ enabled: offer?.b2b?.enabled ?? false, type: offer?.b2b?.type || 'percent', value: offer?.b2b?.value ?? '' });
  const [selected, setSelected] = useState(new Set((offer?.productIds || []).map((p) => (typeof p === 'string' ? p : p._id))));
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const toggle = (id) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };

  async function save(e) {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const body = {
        title,
        active,
        productIds: [...selected],
        b2c: { enabled: b2c.enabled, type: b2c.type, value: Number(b2c.value) || 0 },
        b2b: { enabled: b2b.enabled, type: b2b.type, value: Number(b2b.value) || 0 }
      };
      if (isEdit) await api.put(`/catalog/offers/${offer._id}`, body);
      else await api.post('/catalog/offers', body);
      onSaved();
    } catch (e2) { setErr(e2.message || 'Save failed'); setSaving(false); }
  }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={overlay} onClick={onClose}>
      <form style={modal} onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#ffffff' }}>{isEdit ? 'Edit Offer' : 'Create Offer'}</h3>
          <button type="button" onClick={onClose} style={{ background: '#282828', border: 0, color: '#b3b3b3', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}>✕</button>
        </div>
        {err && <div style={{ background: 'rgba(243,114,127,0.15)', color: '#f3727f', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{err}</div>}

        <input required placeholder="Offer title (e.g. Festive Sale)" value={title} onChange={(e) => setTitle(e.target.value)} style={{ ...input, width: '100%', boxSizing: 'border-box' }} />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '12px 0', color: '#ffffff', fontWeight: 600, fontSize: 13 }}>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active
        </label>

        <DiscountRow label="B2C discount (website + catalog)" rule={b2c} setRule={setB2c} />
        <DiscountRow label="B2B discount (dealer price)" rule={b2b} setRule={setB2b} />

        <div style={{ fontWeight: 700, fontSize: 13, color: '#ffffff', margin: '16px 0 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Products ({selected.size} selected)</div>
        <input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...input, width: '100%', boxSizing: 'border-box', marginBottom: 10 }} />
        <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #282828', borderRadius: 8, background: '#181818' }}>
          {filtered.map((p) => (
            <label key={p._id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderBottom: '1px solid #252525', cursor: 'pointer', color: '#ffffff', fontSize: 13 }}>
              <input type="checkbox" checked={selected.has(p._id)} onChange={() => toggle(p._id)} style={{ marginTop: 13, accentColor: '#1ed760' }} />
              <div style={{ width: 40, height: 40, borderRadius: 6, background: '#ffffff', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 3 }}>
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  : <span style={{ fontSize: 9, color: '#7c7c7c' }}>Item</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span style={{ color: '#b3b3b3', fontSize: 12, flexShrink: 0 }}>₹{p.price}{p.dealerPrice ? ` · dealer ₹${p.dealerPrice}` : ''}</span>
                </div>
                {p.variants?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {p.variants.map((v, i) => (
                      <span key={i} style={{ fontSize: 11, color: '#b3b3b3', background: '#252525', borderRadius: 6, padding: '2px 8px' }}>
                        {v.label || `${v.quantity}${v.unit}`} · ₹{v.price}{v.dealerPrice ? ` / D₹${v.dealerPrice}` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </label>
          ))}
          {filtered.length === 0 && <div style={{ padding: 12, color: '#b3b3b3', fontSize: 13 }}>No products found.</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button type="button" onClick={onClose} style={{ ...btn, background: 'transparent', color: '#f3727f', border: '1px solid rgba(243,114,127,0.4)' }}>Cancel</button>
          <button type="submit" disabled={saving} style={btn}>{saving ? 'Saving…' : (isEdit ? 'Save Offer' : 'Create Offer')}</button>
        </div>
      </form>
    </div>
  );
}

function DiscountRow({ label, rule, setRule }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '10px 0' }}>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 230, color: '#ffffff', fontSize: 13, fontWeight: 600 }}>
        <input type="checkbox" checked={rule.enabled} onChange={(e) => setRule({ ...rule, enabled: e.target.checked })} />
        <span>{label}</span>
      </label>
      <select value={rule.type} onChange={(e) => setRule({ ...rule, type: e.target.value })} style={{ ...input, width: 110 }} disabled={!rule.enabled}>
        <option value="percent">% off</option>
        <option value="flat">₹ flat off</option>
      </select>
      <input type="number" placeholder={rule.type === 'flat' ? '₹ amount' : '% value'} value={rule.value} onChange={(e) => setRule({ ...rule, value: e.target.value })} style={{ ...input, width: 110 }} disabled={!rule.enabled} />
    </div>
  );
}

const pill = (bg, color, border) => ({ background: bg, color, border: `1px solid ${border}`, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999, marginLeft: 8, textTransform: 'uppercase', letterSpacing: '1px' });
const input = { padding: '9px 14px', background: '#1f1f1f', border: '1px solid #333', borderRadius: 500, color: '#ffffff', fontSize: 13, outline: 'none' };
const btn = { background: '#1ed760', color: '#000000', border: 0, borderRadius: 9999, padding: '10px 18px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '1.4px', cursor: 'pointer' };
const miniBtn = { border: 0, borderRadius: 9999, padding: '5px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 };
const modal = { background: '#1f1f1f', border: '1px solid #282828', borderRadius: 12, padding: 24, width: 'min(560px, 94vw)', maxHeight: '90vh', overflowY: 'auto', color: '#ffffff', boxShadow: 'rgba(0,0,0,0.5) 0px 8px 24px' };

