import React, { useEffect, useState } from 'react';
import { api } from '../../adminApi';
import Loader from './Loader';
import { EditIcon, TrashIcon, CalendarIcon, BoxIcon, IconBtn, ConfirmModal } from './adminUi';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const UNITS = ['g', 'kg', 'ml', 'litre', 'piece', 'pack', 'box', 'dozen', 'combo', 'sticks', 'unit', 'set'];

// Small removable thumbnail used by gallery editors.
function Thumb({ src, isVideo, onRemove }) {
  return (
    <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
      {isVideo
        ? <video src={src} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, border: '1px solid #333', background: '#000' }} muted />
        : <img src={src} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, border: '1px solid #333' }} />}
      <button type="button" onClick={onRemove} title="Remove"
        style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#f3727f', color: '#000', border: 0, cursor: 'pointer', fontSize: 11, lineHeight: '18px', padding: 0, fontWeight: 800 }}>×</button>
    </div>
  );
}

// Editor for size/quantity variants (250g, 500g, 1kg...) each with its own price,
// a MAIN image and multiple ADDITIONAL images.
function VariantsEditor({ variants, setVariants }) {
  const add = () => setVariants([...variants, { quantity: '', unit: 'g', price: '', dealerPrice: '', imageUrl: '', imageFile: null, images: [], newImages: [] }]);
  const upd = (i, k, v) => { const n = [...variants]; n[i] = { ...n[i], [k]: v }; setVariants(n); };
  const del = (i) => setVariants(variants.filter((_, idx) => idx !== i));
  const addImages = (i, files) => { const n = [...variants]; n[i] = { ...n[i], newImages: [...(n[i].newImages || []), ...Array.from(files)] }; setVariants(n); };
  const rmExisting = (i, url) => { const n = [...variants]; n[i] = { ...n[i], images: (n[i].images || []).filter((u) => u !== url) }; setVariants(n); };
  const rmNew = (i, idx) => { const n = [...variants]; n[i] = { ...n[i], newImages: (n[i].newImages || []).filter((_, j) => j !== idx) }; setVariants(n); };

  return (
    <div style={{ border: '1px solid #282828', borderRadius: 8, padding: 14, background: '#181818' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>Size / Quantity variants</div>
        <button type="button" onClick={add} style={{ ...miniBtn, background: '#1ed760', color: '#000' }}>+ Add size</button>
      </div>
      {variants.length === 0 && (
        <div style={{ fontSize: 12, color: '#b3b3b3' }}>No variants — the base price/image is used. Add sizes like 250 g, 500 g, 1 kg, each with its own price, a main image and extra images.</div>
      )}
      {variants.map((v, i) => (
        <div key={i} style={{ border: '1px solid #282828', borderRadius: 8, padding: 10, marginBottom: 10, background: '#141414' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'nowrap' }}>
            {(v.imageFile || v.imageUrl) ? (
              <img src={v.imageFile ? URL.createObjectURL(v.imageFile) : v.imageUrl} alt="" style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 6, border: '1px solid #333', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 38, height: 38, borderRadius: 6, background: '#252525', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#7c7c7c', flexShrink: 0 }}>img</div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <input type="number" placeholder="Qty" value={v.quantity} onChange={(e) => upd(i, 'quantity', e.target.value)} style={{ ...input, width: 70 }} />
              <select value={v.unit} onChange={(e) => upd(i, 'unit', e.target.value)} style={{ ...input, width: 86 }}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <input type="number" placeholder="B2C ₹" value={v.price} onChange={(e) => upd(i, 'price', e.target.value)} style={{ ...input, width: 92 }} />
              <input type="number" placeholder="Dealer ₹" value={v.dealerPrice} onChange={(e) => upd(i, 'dealerPrice', e.target.value)} style={{ ...input, width: 92 }} />
              <label style={{ ...miniBtn, background: '#282828', color: '#ffffff', cursor: 'pointer', border: '1px solid #4d4d4d' }}>
                {v.imageFile || v.imageUrl ? 'Change main' : 'Main image'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => upd(i, 'imageFile', e.target.files[0])} />
              </label>
            </div>
            <button type="button" onClick={() => del(i)} title="Remove variant" style={{ ...miniBtn, background: 'transparent', color: '#f3727f', border: '1px solid rgba(243,114,127,0.4)', flexShrink: 0, alignSelf: 'center' }}>✕</button>
          </div>
          {/* Additional images for this variant */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
            <span style={{ fontSize: 11, color: '#7c7c7c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Extra images:</span>
            {(v.images || []).map((url) => <Thumb key={url} src={url} onRemove={() => rmExisting(i, url)} />)}
            {(v.newImages || []).map((f, idx) => <Thumb key={idx} src={URL.createObjectURL(f)} onRemove={() => rmNew(i, idx)} />)}
            <label style={{ ...miniBtn, background: '#282828', color: '#ffffff', cursor: 'pointer', border: '1px dashed #4d4d4d' }}>
              + Add
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => addImages(i, e.target.files)} />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProductsAdminPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [msg, setMsg] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [scheduleFor, setScheduleFor] = useState(null); // product being scheduled
  const [availFor, setAvailFor] = useState(null); // product for availability modal
  const [editing, setEditing] = useState(null); // product being edited (null = create)
  const [formOpen, setFormOpen] = useState(false); // add/edit modal open
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [p, c] = await Promise.all([api.get('/products?all=1'), api.get('/catalog/categories?all=1')]);
      setProducts(p.data || []);
      setCategories(c.data || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function syncCatalog() {
    setSyncing(true);
    setMsg('');
    try {
      const res = await api.post('/products/catalog/sync', {});
      setMsg(`Catalog synced: ${res.pushed} pushed, ${res.failed} failed of ${res.total}.`);
    } catch (e) { setMsg(`Sync failed: ${e.message}`); }
    setSyncing(false);
  }

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (p) => { setEditing(p); setFormOpen(true); };

  if (loading) return <Loader />;

  return (
    <div style={{ padding: 28, fontFamily: 'SpotifyMixUI, Inter, sans-serif', color: '#ffffff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 4, fontSize: 24, fontWeight: 700, color: '#ffffff' }}>Products</h1>
          <p style={{ margin: 0, color: '#b3b3b3', fontSize: 14 }}>Manage product catalog, pricing, variants, and stock schedules.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={openNew} style={btn}>+ Add Product</button>
          <button onClick={syncCatalog} disabled={syncing} style={{ ...btn, background: '#1f1f1f', color: '#ffffff', border: '1px solid #4d4d4d' }}>
            {syncing ? 'Syncing…' : 'Sync WhatsApp Catalog'}
          </button>
        </div>
      </div>
      {msg && <div style={{ background: 'rgba(30, 215, 96, 0.15)', color: '#1ed760', border: '1px solid rgba(30, 215, 96, 0.3)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 20, marginTop: 16 }}>
        {products.map((p) => {
          const outOfStock = p.isPaused || p.inStock === false || p.active === false;
          const scheduled = !!p.soldOutSchedule?.enabled;
          return (
            <div key={p._id}
              style={{ background: '#181818', border: '1px solid #282828', borderRadius: 14, overflow: 'hidden', transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease', boxShadow: 'rgba(0,0,0,0.35) 0px 6px 16px' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.boxShadow = 'rgba(0,0,0,0.5) 0px 12px 28px'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#282828'; e.currentTarget.style.boxShadow = 'rgba(0,0,0,0.35) 0px 6px 16px'; }}
            >
              {/* Image (1:1) with overlays */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#ffffff' }}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: outOfStock ? 0.55 : 1 }}
                    onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div style={{ display: p.imageUrl ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c7c7c', fontSize: 12, fontWeight: 600, background: '#252525', position: 'absolute', inset: 0 }}>No Image</div>

                {/* Status badge (top-left) */}
                <span style={{ position: 'absolute', top: 10, left: 10, fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 9999, textTransform: 'uppercase', letterSpacing: '0.8px', background: outOfStock ? 'rgba(243,114,127,0.92)' : 'rgba(30,215,96,0.92)', color: '#0a0a0a', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                  {outOfStock ? 'Out of stock' : 'In stock'}
                </span>

                {/* Edit + Schedule icons (top-right) */}
                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                  <IconBtn icon={<EditIcon size={15} color="#ffffff" />} title="Edit product" onClick={() => openEdit(p)} />
                  <IconBtn icon={<CalendarIcon size={15} color={scheduled ? '#1ed760' : '#ffffff'} />} title="Schedule availability" onClick={() => setScheduleFor(p)} />
                </div>
              </div>

              {/* Details */}
              <div style={{ padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ color: '#b3b3b3', fontSize: 13, marginTop: 2 }}>{p.category}</div>
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#1ed760' }}>
                    {p.offerPrice ? (
                      <><span style={{ color: '#7c7c7c', textDecoration: 'line-through', fontWeight: 400, fontSize: 13, marginRight: 6 }}>₹{p.price}</span>₹{p.offerPrice}</>
                    ) : (<>₹{p.price}</>)}
                  </span>
                  {p.dealerPrice ? (
                    <span style={{ fontSize: 12, color: '#b3b3b3' }}>
                      | Dealer{' '}
                      {p.dealerOfferPrice ? (
                        <><span style={{ textDecoration: 'line-through', marginRight: 4 }}>₹{p.dealerPrice}</span><span style={{ color: '#1ed760', fontWeight: 700 }}>₹{p.dealerOfferPrice}</span></>
                      ) : (<>₹{p.dealerPrice}</>)}
                    </span>
                  ) : null}
                </div>
                {(p.offerPrice || p.dealerOfferPrice) && p.offerTitle && (
                  <div style={{ marginTop: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 9999, background: 'rgba(255,164,43,0.15)', color: '#ffa42b', border: '1px solid rgba(255,164,43,0.35)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      🏷 {p.offerTitle}
                    </span>
                  </div>
                )}
                {p.variants?.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #282828', paddingTop: 10 }}>
                    {p.variants.map((v, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        {v.imageUrl
                          ? <img src={v.imageUrl} alt="" style={{ width: 26, height: 26, borderRadius: 5, objectFit: 'cover', background: '#fff', flexShrink: 0 }} />
                          : <span style={{ width: 26, height: 26, borderRadius: 5, background: '#333', flexShrink: 0 }} />}
                        <span style={{ color: '#e0e0e0', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.label || `${v.quantity}${v.unit}`}</span>
                        <span style={{ color: '#1ed760', fontWeight: 700, flexShrink: 0 }}>
                          {v.offerPrice ? (
                            <><span style={{ color: '#7c7c7c', textDecoration: 'line-through', fontWeight: 400, marginRight: 4 }}>₹{v.price}</span>₹{v.offerPrice}</>
                          ) : (<>₹{v.price}</>)}
                        </span>
                        {v.dealerPrice ? (
                          <span style={{ color: '#b3b3b3', fontSize: 11, flexShrink: 0 }}>
                            {v.dealerOfferPrice ? (
                              <>· D <span style={{ textDecoration: 'line-through', marginRight: 3 }}>₹{v.dealerPrice}</span>₹{v.dealerOfferPrice}</>
                            ) : (<>· D ₹{v.dealerPrice}</>)}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#ffa42b' }}>
                  <span>★ {(p.avgRating || p.rating || 0).toFixed ? (p.avgRating || p.rating || 0).toFixed(1) : (p.avgRating || p.rating || 0)} ({p.totalRatings || p.reviewCount || 0})</span>
                  {scheduled && <span style={{ color: '#539df5' }}>· Scheduled</span>}
                </div>

                {/* Availability button */}
                <button onClick={() => setAvailFor(p)}
                  style={{ marginTop: 14, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px 12px', borderRadius: 9999, cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', border: `1px solid ${outOfStock ? 'rgba(243,114,127,0.4)' : 'rgba(30,215,96,0.4)'}`, background: outOfStock ? 'rgba(243,114,127,0.12)' : 'rgba(30,215,96,0.12)', color: outOfStock ? '#f3727f' : '#1ed760' }}>
                  <BoxIcon size={15} /> Availability
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {scheduleFor && (
        <ScheduleModal product={scheduleFor} onClose={() => setScheduleFor(null)} onSaved={() => { setScheduleFor(null); load(); }} />
      )}

      {availFor && (
        <AvailabilityModal product={availFor} onClose={() => setAvailFor(null)} onSaved={() => { setAvailFor(null); load(); }} />
      )}

      {formOpen && (
        <ProductFormModal
          product={editing}
          categories={categories}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); load(); }}
          onDeleted={() => { setFormOpen(false); load(); }}
        />
      )}
    </div>
  );
}

// Availability popup — set a product In Stock / Out of Stock.
function AvailabilityModal({ product, onClose, onSaved }) {
  const [busy, setBusy] = useState(false);
  const paused = !!product.isPaused;
  async function set(val) {
    setBusy(true);
    try {
      await api.patch(`/products/${product._id}/availability`, { isPaused: val });
      onSaved();
    } catch (e) { alert(e.message || 'Failed'); setBusy(false); }
  }
  const optionStyle = (activeSel, accent) => ({
    display: 'flex', alignItems: 'center', gap: 12, width: '100%', boxSizing: 'border-box', textAlign: 'left',
    padding: '14px 16px', borderRadius: 12, cursor: busy ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700,
    background: activeSel ? `${accent}22` : '#181818', color: '#ffffff',
    border: `1px solid ${activeSel ? accent : '#333'}`
  });
  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ ...modal, width: 'min(440px, 92vw)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#ffffff' }}>Availability</h3>
          <button type="button" onClick={onClose} style={{ background: '#282828', border: 0, color: '#b3b3b3', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ margin: '0 0 18px', color: '#b3b3b3', fontSize: 13 }}>{product.name}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button type="button" disabled={busy} onClick={() => set(false)} style={optionStyle(!paused, '#1ed760')}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#1ed760', flexShrink: 0 }} />
            In Stock — available to order
            {!paused && <span style={{ marginLeft: 'auto', color: '#1ed760' }}>✓</span>}
          </button>
          <button type="button" disabled={busy} onClick={() => set(true)} style={optionStyle(paused, '#f3727f')}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f3727f', flexShrink: 0 }} />
            Out of Stock — hidden from ordering
            {paused && <span style={{ marginLeft: 'auto', color: '#f3727f' }}>✓</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

// Styled category picker: shows each category's tile image + name in the dropdown.
function CategorySelect({ categories, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
  const selected = categories.find((c) => c.name === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const thumb = (url) => (url
    ? <img src={url} alt="" style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '1px solid #3a3a3a', background: '#fff' }} />
    : <div style={{ width: 26, height: 26, borderRadius: 6, background: '#333', flexShrink: 0 }} />);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...input, width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 10,
          cursor: 'pointer', textAlign: 'left', paddingTop: 6, paddingBottom: 6,
          borderColor: open ? '#1ed760' : '#333'
        }}
      >
        {selected && thumb(selected.imageUrl)}
        <span style={{ flex: 1, color: selected ? '#ffffff' : '#7c7c7c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.name : 'Category *'}
        </span>
        <span style={{ color: '#b3b3b3', fontSize: 10, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
          background: '#282828', border: '1px solid #3a3a3a', borderRadius: 12, padding: 6,
          maxHeight: 260, overflowY: 'auto', boxShadow: 'rgba(0,0,0,0.5) 0px 10px 30px'
        }}>
          {categories.length === 0 && <div style={{ padding: 10, color: '#7c7c7c', fontSize: 13 }}>No categories yet</div>}
          {categories.map((c) => {
            const active = c.name === value;
            return (
              <button
                key={c._id}
                type="button"
                onClick={() => { onChange(c.name); setOpen(false); }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#3a3a3a'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', boxSizing: 'border-box',
                  padding: '7px 8px', border: 0, borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  background: active ? 'rgba(30,215,96,0.15)' : 'transparent', color: '#ffffff', fontSize: 13
                }}
              >
                {thumb(c.imageUrl)}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                {active && <span style={{ color: '#1ed760', fontSize: 13 }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProductFormModal({ product, categories, onClose, onSaved, onDeleted }) {
  const isEdit = !!product;
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function doDelete() {
    setDeleting(true);
    try {
      await api.del(`/products/${product._id}`);
      onDeleted ? onDeleted() : onClose();
    } catch (e) { alert(e.message || 'Delete failed'); setDeleting(false); setConfirmDel(false); }
  }
  const [form, setForm] = useState({
    name: product?.name || '',
    category: product?.category || '',
    shortDesc: product?.shortDesc || '',
    description: product?.description || '',
    margin: product?.margin || '',
    moq: product?.moq || '',
    deliveryCharge: product?.deliveryCharge ?? '',
    badges: (product?.badges || []).join(', ')
  });
  const [chargeDelivery, setChargeDelivery] = useState((product?.deliveryCharge || 0) > 0);
  const [variants, setVariants] = useState(
    (product?.variants || []).map((v) => ({
      quantity: v.quantity ?? '',
      unit: v.unit || 'g',
      price: v.price ?? '',
      dealerPrice: v.dealerPrice ?? '',
      imageUrl: v.imageUrl || '',
      imageFile: null,
      images: Array.isArray(v.images) ? [...v.images] : [],
      newImages: []
    }))
  );
  const [cover, setCover] = useState(null); // cover image file
  const [coverUrl, setCoverUrl] = useState(product?.coverImageUrl || '');
  const [video, setVideo] = useState(null); // video file
  const [videoUrl, setVideoUrl] = useState(product?.videoUrl || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    if (!form.category) { setErr('Please select a category'); return; }
    if (!variants.some((v) => Number(v.price) > 0)) { setErr('Add at least one size/variant with a price.'); return; }
    setSaving(true);
    setErr('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      // Delivery charge only applies when the Shipping checkbox is on; else 0.
      fd.set('deliveryCharge', chargeDelivery ? (Number(form.deliveryCharge) || 0) : 0);

      // Variants carry price/qty/unit + their own images. Backend derives the
      // product's base price/image from the first variant.
      const variantsPayload = variants.map(({ imageFile, newImages, ...v }) => v);
      fd.append('variants', JSON.stringify(variantsPayload));
      variants.forEach((v, i) => {
        if (v.imageFile) fd.append(`variant_image_${i}`, v.imageFile);
        (v.newImages || []).forEach((f) => fd.append(`variant_gallery_${i}`, f));
      });

      // Cover image: new file, or the kept/cleared url.
      if (cover) fd.append('cover', cover);
      else fd.append('coverImageUrl', coverUrl || '');

      // Video: new file, or the kept/cleared url.
      if (video) fd.append('video', video);
      else fd.append('videoUrl', videoUrl || '');

      if (isEdit) await api.putForm(`/products/${product._id}`, fd);
      else await api.postForm('/products', fd);
      onSaved();
    } catch (e2) {
      setErr(e2.message || 'Save failed');
      setSaving(false);
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <form style={{ ...modal, width: 'min(920px, 96vw)' }} onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#ffffff' }}>{isEdit ? `Edit Product — ${product.name}` : 'Add Product'}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {isEdit && (
              <button type="button" title="Delete product" onClick={() => setConfirmDel(true)}
                style={{ background: 'rgba(243,114,127,0.14)', border: '1px solid rgba(243,114,127,0.4)', color: '#f3727f', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrashIcon size={15} color="#f3727f" />
              </button>
            )}
            <button type="button" onClick={onClose} style={{ background: '#282828', border: 0, color: '#b3b3b3', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}>✕</button>
          </div>
        </div>
        {confirmDel && (
          <ConfirmModal
            title="Delete this product?"
            message={`"${product.name}" will be permanently removed from the site and the WhatsApp catalog. This can't be undone.`}
            confirmText="Delete Product"
            busy={deleting}
            onConfirm={doDelete}
            onCancel={() => setConfirmDel(false)}
          />
        )}
        {err && <div style={{ background: 'rgba(243,114,127,0.15)', color: '#f3727f', padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{err}</div>}

        <div style={{ background: 'rgba(30,215,96,0.08)', border: '1px solid rgba(30,215,96,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#b3b3b3' }}>
          Prices, quantity, unit and product images are set per size in the <b style={{ color: '#1ed760' }}>Size / Quantity variants</b> section below. Cover image &amp; video apply to the whole product.
        </div>

        {/* Cover image + Video (product-level) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ background: '#181818', border: '1px solid #333', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#b3b3b3', fontWeight: 600, marginBottom: 8 }}>Cover image <span style={{ color: '#7c7c7c' }}>(detail hero)</span></div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {(cover || coverUrl) ? (
                <div style={{ position: 'relative' }}>
                  <img src={cover ? URL.createObjectURL(cover) : coverUrl} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #333' }} />
                  <button type="button" onClick={() => { setCover(null); setCoverUrl(''); }} title="Remove" style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#f3727f', color: '#000', border: 0, cursor: 'pointer', fontSize: 11, fontWeight: 800, padding: 0 }}>×</button>
                </div>
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: 8, background: '#252525', border: '1px dashed #4d4d4d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#7c7c7c' }}>None</div>
              )}
              <label style={{ ...miniBtn, background: '#282828', color: '#fff', cursor: 'pointer', border: '1px solid #4d4d4d' }}>
                {(cover || coverUrl) ? 'Change' : 'Choose'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setCover(e.target.files[0])} />
              </label>
            </div>
          </div>
          <div style={{ background: '#181818', border: '1px solid #333', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#b3b3b3', fontWeight: 600, marginBottom: 8 }}>Product video <span style={{ color: '#7c7c7c' }}>(mp4)</span></div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {(video || videoUrl) ? (
                <div style={{ position: 'relative' }}>
                  <video src={video ? URL.createObjectURL(video) : videoUrl} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #333', background: '#000' }} muted />
                  <button type="button" onClick={() => { setVideo(null); setVideoUrl(''); }} title="Remove" style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#f3727f', color: '#000', border: 0, cursor: 'pointer', fontSize: 11, fontWeight: 800, padding: 0 }}>×</button>
                </div>
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: 8, background: '#252525', border: '1px dashed #4d4d4d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#7c7c7c' }}>▶</div>
              )}
              <label style={{ ...miniBtn, background: '#282828', color: '#fff', cursor: 'pointer', border: '1px solid #4d4d4d' }}>
                {(video || videoUrl) ? 'Change' : 'Choose'}
                <input type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => setVideo(e.target.files[0])} />
              </label>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
          <div><label style={fieldLbl}>Product name *</label><input required placeholder="e.g. Agarbathi" value={form.name} onChange={set('name')} style={{ ...input, width: '100%', boxSizing: 'border-box' }} /></div>
          <div><label style={fieldLbl}>Category *</label><CategorySelect categories={categories} value={form.category} onChange={(name) => setForm({ ...form, category: name })} /></div>
          <div><label style={fieldLbl}>Dealer margin</label><input placeholder="e.g. 20-35%" value={form.margin} onChange={set('margin')} style={{ ...input, width: '100%', boxSizing: 'border-box' }} /></div>
          <div><label style={fieldLbl}>MOQ</label><input placeholder="Min order qty" value={form.moq} onChange={set('moq')} style={{ ...input, width: '100%', boxSizing: 'border-box' }} /></div>
          <div><label style={fieldLbl}>Badges</label><input placeholder="comma separated" value={form.badges} onChange={set('badges')} style={{ ...input, width: '100%', boxSizing: 'border-box' }} /></div>
        </div>
        <div style={{ marginTop: 12 }}><label style={fieldLbl}>Short description</label><input placeholder="One-line summary" value={form.shortDesc} onChange={set('shortDesc')} style={{ ...input, width: '100%', boxSizing: 'border-box' }} /></div>
        <div style={{ marginTop: 12 }}><label style={fieldLbl}>Full description</label><textarea placeholder="Full product description" value={form.description} onChange={set('description')} rows={3} style={{ ...input, width: '100%', boxSizing: 'border-box', resize: 'vertical', borderRadius: 12 }} /></div>

        {/* Delivery / shipping charge */}
        <div style={{ marginTop: 12, background: '#181818', border: '1px solid #333', borderRadius: 12, padding: '12px 14px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: '#ffffff' }}>
            <input type="checkbox" checked={chargeDelivery} onChange={(e) => setChargeDelivery(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#1ed760', cursor: 'pointer' }} />
            Shipping (Delivery) — charge a delivery fee for this product
          </label>
          {chargeDelivery ? (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#b3b3b3', fontSize: 13 }}>Delivery charge (₹)</span>
              <input type="number" min="0" placeholder="e.g. 40" value={form.deliveryCharge} onChange={set('deliveryCharge')} style={{ ...input, width: 150 }} />
            </div>
          ) : (
            <div style={{ marginTop: 6, fontSize: 12, color: '#7c7c7c' }}>Free delivery (₹0) for this product.</div>
          )}
        </div>

        <div style={{ marginTop: 14 }}>
          <VariantsEditor variants={variants} setVariants={setVariants} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button type="button" onClick={onClose} style={{ ...btn, background: 'transparent', color: '#f3727f', border: '1px solid rgba(243,114,127,0.4)' }}>Cancel</button>
          <button type="submit" disabled={saving} style={btn}>{saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Add Product')}</button>
        </div>
      </form>
    </div>
  );
}

function ScheduleModal({ product, onClose, onSaved }) {
  const s = product.soldOutSchedule || {};
  const [enabled, setEnabled] = useState(!!s.enabled);
  const [type, setType] = useState(s.type || 'daily');
  const [dailyStart, setDailyStart] = useState(s.dailyStartTime || '09:00');
  const [dailyEnd, setDailyEnd] = useState(s.dailyEndTime || '22:00');
  const [days, setDays] = useState(
    DAYS.map((d) => {
      const found = (s.days || []).find((x) => x.day === d);
      return { day: d, enabled: found?.enabled || false, startTime: found?.startTime || '09:00', endTime: found?.endTime || '22:00' };
    })
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const soldOutSchedule = { enabled, type, dailyStartTime: dailyStart, dailyEndTime: dailyEnd, days };
    await api.patch(`/products/${product._id}/schedule`, { soldOutSchedule });
    setSaving(false);
    onSaved();
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#ffffff' }}>Availability Schedule — {product.name}</h3>
          <button onClick={onClose} style={{ background: '#282828', border: 0, color: '#b3b3b3', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ color: '#b3b3b3', fontSize: 13, marginBottom: 16 }}>
          Defines the window when the product is <b>available</b>. Outside the window it auto-switches to out of stock.
        </p>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, color: '#ffffff', fontWeight: 600, fontSize: 14 }}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Enable schedule
        </label>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, color: '#ffffff' }}>
          <label><input type="radio" checked={type === 'daily'} onChange={() => setType('daily')} /> Daily</label>
          <label><input type="radio" checked={type === 'custom'} onChange={() => setType('custom')} /> Per-day</label>
        </div>

        {type === 'daily' ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: '#ffffff' }}>
            <span>Available</span>
            <input type="time" value={dailyStart} onChange={(e) => setDailyStart(e.target.value)} style={input} />
            <span>to</span>
            <input type="time" value={dailyEnd} onChange={(e) => setDailyEnd(e.target.value)} style={input} />
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {days.map((d, i) => (
              <div key={d.day} style={{ display: 'flex', gap: 10, alignItems: 'center', color: '#ffffff' }}>
                <label style={{ width: 90 }}>
                  <input type="checkbox" checked={d.enabled} onChange={(e) => {
                    const nd = [...days]; nd[i] = { ...d, enabled: e.target.checked }; setDays(nd);
                  }} /> {d.day}
                </label>
                <input type="time" value={d.startTime} onChange={(e) => { const nd = [...days]; nd[i] = { ...d, startTime: e.target.value }; setDays(nd); }} style={input} />
                <span>to</span>
                <input type="time" value={d.endTime} onChange={(e) => { const nd = [...days]; nd[i] = { ...d, endTime: e.target.value }; setDays(nd); }} style={input} />
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ ...btn, background: 'transparent', color: '#f3727f', border: '1px solid rgba(243,114,127,0.4)' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={btn}>{saving ? 'Saving…' : 'Save Schedule'}</button>
        </div>
      </div>
    </div>
  );
}

const input = { padding: '9px 12px', background: '#1f1f1f', border: '1px solid #333', borderRadius: 500, color: '#ffffff', fontSize: 13, outline: 'none' };
const fieldLbl = { display: 'block', fontSize: 11, color: '#8a8a8a', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' };
const btn = { background: '#1ed760', color: '#000000', border: 0, borderRadius: 9999, padding: '10px 18px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '1.4px', cursor: 'pointer' };
const miniBtn = { border: 0, borderRadius: 9999, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 };
const modal = { background: '#1f1f1f', border: '1px solid #282828', borderRadius: 12, padding: 24, width: 'min(640px, 94vw)', maxHeight: '90vh', overflowY: 'auto', color: '#ffffff', boxShadow: 'rgba(0,0,0,0.5) 0px 8px 24px' };

