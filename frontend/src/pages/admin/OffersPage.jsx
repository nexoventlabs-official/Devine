import React, { useEffect, useState } from 'react';
import { api } from '../../adminApi';

// Admin offers: pick products, set a B2C and/or B2B discount. The discounted price
// shows as the current price with the original struck through (site + WhatsApp catalog).
export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null); // offer being edited (null = none)
  const [creating, setCreating] = useState(false);

  async function load() {
    const [o, p] = await Promise.all([api.get('/catalog/offers'), api.get('/products?all=1')]);
    setOffers(o.data || []);
    setProducts(p.data || []);
  }
  useEffect(() => { load(); }, []);

  async function remove(id) {
    if (!confirm('Delete this offer? Prices revert to normal.')) return;
    await api.del(`/catalog/offers/${id}`);
    await load();
  }

  const fmtRule = (r) => (r?.enabled ? (r.type === 'flat' ? `₹${r.value} off` : `${r.value}% off`) : '—');

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ marginTop: 0 }}>Offers</h1>
        <button onClick={() => setCreating(true)} style={btn}>+ Create Offer</button>
      </div>
      <p style={{ color: '#666' }}>Apply a discount to selected products. B2C offers update the website + WhatsApp catalog (original price struck through). B2B offers apply to dealer pricing.</p>

      <div style={{ display: 'grid', gap: 12 }}>
        {offers.map((o) => (
          <div key={o._id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700 }}>
                  {o.title} {o.active ? <span style={pill('#dcfce7', '#15803d')}>Active</span> : <span style={pill('#fee2e2', '#b91c1c')}>Off</span>}
                </div>
                <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
                  B2C: {fmtRule(o.b2c)} · B2B: {fmtRule(o.b2b)} · {o.productIds?.length || 0} product(s)
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {(o.productIds || []).map((p) => p.name).join(', ') || 'No products'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setEditing(o)} style={{ ...btn, background: '#111827', padding: '7px 12px' }}>Edit</button>
                <button onClick={() => remove(o._id)} style={{ ...btn, background: '#c0392b', padding: '7px 12px' }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        {offers.length === 0 && <div style={{ color: '#888' }}>No offers yet. Create one above.</div>}
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
        <h3 style={{ marginTop: 0 }}>{isEdit ? 'Edit Offer' : 'Create Offer'}</h3>
        {err && <div style={{ background: '#fdecec', color: '#c0392b', padding: 10, borderRadius: 8, marginBottom: 12 }}>{err}</div>}

        <input required placeholder="Offer title (e.g. Diwali Sale)" value={title} onChange={(e) => setTitle(e.target.value)} style={{ ...input, width: '100%', boxSizing: 'border-box' }} />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '10px 0' }}>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active
        </label>

        <DiscountRow label="B2C discount (website + catalog)" rule={b2c} setRule={setB2c} />
        <DiscountRow label="B2B discount (dealer price)" rule={b2b} setRule={setB2b} />

        <div style={{ fontWeight: 600, fontSize: 13, margin: '14px 0 6px' }}>Products ({selected.size} selected)</div>
        <input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...input, width: '100%', boxSizing: 'border-box', marginBottom: 8 }} />
        <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8 }}>
          {filtered.map((p) => (
            <label key={p._id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid #f4f4f4', cursor: 'pointer' }}>
              <input type="checkbox" checked={selected.has(p._id)} onChange={() => toggle(p._id)} />
              <span style={{ flex: 1 }}>{p.name}</span>
              <span style={{ color: '#888', fontSize: 12 }}>₹{p.price}{p.dealerPrice ? ` · dealer ₹${p.dealerPrice}` : ''}</span>
            </label>
          ))}
          {filtered.length === 0 && <div style={{ padding: 10, color: '#888', fontSize: 13 }}>No products found.</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button type="button" onClick={onClose} style={{ ...btn, background: '#888' }}>Cancel</button>
          <button type="submit" disabled={saving} style={btn}>{saving ? 'Saving…' : (isEdit ? 'Save Offer' : 'Create Offer')}</button>
        </div>
      </form>
    </div>
  );
}

function DiscountRow({ label, rule, setRule }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', margin: '8px 0' }}>
      <label style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 240 }}>
        <input type="checkbox" checked={rule.enabled} onChange={(e) => setRule({ ...rule, enabled: e.target.checked })} />
        <span style={{ fontSize: 13, color: '#374151' }}>{label}</span>
      </label>
      <select value={rule.type} onChange={(e) => setRule({ ...rule, type: e.target.value })} style={{ ...input, width: 110 }} disabled={!rule.enabled}>
        <option value="percent">% off</option>
        <option value="flat">₹ flat off</option>
      </select>
      <input type="number" placeholder={rule.type === 'flat' ? '₹ amount' : '% value'} value={rule.value} onChange={(e) => setRule({ ...rule, value: e.target.value })} style={{ ...input, width: 110 }} disabled={!rule.enabled} />
    </div>
  );
}

const pill = (bg, color) => ({ background: bg, color, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, marginLeft: 6 });
const input = { padding: 9, border: '1px solid #ddd', borderRadius: 6 };
const btn = { background: '#1a7f37', color: '#fff', border: 0, borderRadius: 6, padding: '9px 14px', cursor: 'pointer' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modal = { background: '#fff', borderRadius: 12, padding: 24, width: 'min(560px, 94vw)', maxHeight: '90vh', overflowY: 'auto' };
