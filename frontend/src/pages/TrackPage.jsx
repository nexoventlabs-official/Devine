import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import { API_BASE_URL, SERVER_ORIGIN } from '../config';

// ---- Markers ----
const lorryIcon = L.divIcon({
  className: 'lorry-marker',
  html: `<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))">
    <svg width="44" height="44" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="20" width="34" height="24" rx="3" fill="#0e7a3b"/>
      <path d="M36 26h12l10 10v8H36z" fill="#12934a"/>
      <rect x="40" y="28" width="10" height="8" rx="1.5" fill="#bff0c8"/>
      <circle cx="16" cy="48" r="6" fill="#1f2937"/><circle cx="16" cy="48" r="2.4" fill="#fff"/>
      <circle cx="48" cy="48" r="6" fill="#1f2937"/><circle cx="48" cy="48" r="2.4" fill="#fff"/>
    </svg></div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 40]
});
const storeIcon = L.divIcon({
  className: 'pin',
  html: `<div style="background:#1f2937;color:#fff;width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3)"><span style="transform:rotate(45deg);font-size:16px">🏬</span></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34]
});
const homeIcon = L.divIcon({
  className: 'pin',
  html: `<div style="background:#0e7a3b;color:#fff;width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3)"><span style="transform:rotate(45deg);font-size:15px">🏠</span></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34]
});

const STEPS = [
  { key: 'confirmed', label: 'Order Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' }
];
const STORE_DEFAULT = { latitude: 13.0827, longitude: 80.2707 }; // Chennai

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    const valid = points.filter((p) => p && p[0] != null);
    if (valid.length === 1) map.setView(valid[0], 13);
    else if (valid.length > 1) map.fitBounds(valid, { padding: [60, 60] });
  }, [JSON.stringify(points)]);
  return null;
}

// Fetch a road-following route from OSM's OSRM (free, no key). Returns [[lat,lng],...].
async function fetchRoadRoute(from, to) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const json = await res.json();
    const coords = json?.routes?.[0]?.geometry?.coordinates;
    if (coords?.length) return coords.map((c) => [c[1], c[0]]);
  } catch (_) { /* fall back to straight line */ }
  return [from, to];
}

export default function TrackPage() {
  const params = new URLSearchParams(window.location.search);
  const orderKey = params.get('order');
  const phone = params.get('phone');
  const [order, setOrder] = useState(null);
  const [driver, setDriver] = useState(null);
  const [route, setRoute] = useState([]);
  const [tab, setTab] = useState('tracking');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const socketRef = useRef(null);

  async function load() {
    try {
      const url = orderKey ? `${API_BASE_URL}/orders/track/${orderKey}` : `${API_BASE_URL}/orders/latest/${phone}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setOrder(json.data);
        if (json.data.driverLocation?.latitude) setDriver(json.data.driverLocation);
      } else setError('Order not found');
    } catch {
      setError('Unable to load order');
    }
  }

  useEffect(() => { load(); }, []);

  // Live updates
  useEffect(() => {
    if (!order?.orderId) return;
    const socket = io(SERVER_ORIGIN, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.emit('joinOrder', order.orderId);
    socket.on('driver', (loc) => setDriver(loc));
    socket.on('status', (data) => setOrder((o) => ({ ...o, status: data.status, trackingUpdates: data.updates })));
    return () => socket.disconnect();
  }, [order?.orderId]);

  const store = order?.storeLocation?.latitude ? order.storeLocation : STORE_DEFAULT;
  const dest = order?.deliveryLocation;
  const driverPos = driver?.latitude ? [driver.latitude, driver.longitude] : null;
  const storePos = [store.latitude, store.longitude];
  const destPos = dest?.latitude ? [dest.latitude, dest.longitude] : null;

  // During out-for-delivery, route from the driver; otherwise store -> destination.
  const isOutForDelivery = order?.status === 'out_for_delivery';
  const routeFrom = isOutForDelivery && driverPos ? driverPos : storePos;

  useEffect(() => {
    if (!destPos) { setRoute([]); return; }
    let active = true;
    fetchRoadRoute(routeFrom, destPos).then((r) => { if (active) setRoute(r); });
    return () => { active = false; };
  }, [JSON.stringify(routeFrom), JSON.stringify(destPos)]);

  const mapPoints = useMemo(
    () => [storePos, driverPos, destPos].filter(Boolean),
    [JSON.stringify(storePos), JSON.stringify(driverPos), JSON.stringify(destPos)]
  );

  const currentIndex = STEPS.findIndex((s) => s.key === order?.status);
  const delivered = order?.status === 'delivered';
  const updateAt = {};
  (order?.trackingUpdates || []).forEach((u) => { updateAt[u.status] = u.timestamp; });

  const headerText = delivered
    ? 'Order Delivered'
    : isOutForDelivery
      ? 'Order is on the way'
      : order?.status
        ? STEPS.find((s) => s.key === order.status)?.label || 'Order Update'
        : 'Tracking';

  function copyTrack() {
    const id = order?.trackId || order?.orderId || '';
    navigator.clipboard?.writeText(id).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }

  if (error) return <div style={s.center}>{error}</div>;
  if (!order) return <div style={s.center}>Loading your order…</div>;

  const itemsSummary = (order.items || []).map((i) => `${i.quantity}× ${i.name}`).join(', ');

  return (
    <div style={s.page}>
      {/* Green header bar */}
      <div style={s.headerBar}>
        <div style={s.headerTitle}>{headerText}</div>
        <div style={s.etaPill}>
          {delivered ? 'Delivered on time' : order.expectedDelivery ? `By ${new Date(order.expectedDelivery).toDateString()}` : 'On the way'}
        </div>
      </div>

      {/* Map */}
      <div style={s.mapWrap}>
        <MapContainer center={destPos || storePos} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; OpenStreetMap &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
          />
          {/* Subtle blue casing under the route for a clean map look */}
          {route.length > 1 && <Polyline positions={route} color="#1a73e8" weight={9} opacity={0.25} />}
          {route.length > 1 && <Polyline positions={route} color="#1a73e8" weight={5} opacity={0.95} />}
          <Marker position={storePos} icon={storeIcon}><Popup>Devine Store</Popup></Marker>
          {destPos && <Marker position={destPos} icon={homeIcon}><Popup>Delivery Location</Popup></Marker>}
          {driverPos && <Marker position={driverPos} icon={lorryIcon}><Popup>Your delivery is on the way</Popup></Marker>}
          <FitBounds points={route.length > 1 ? route : mapPoints} />
        </MapContainer>
      </div>

      {/* Status card */}
      <div style={{ ...s.card, background: delivered ? '#0e7a3b' : '#12934a' }}>
        <div style={s.cardTitleRow}>
          <span style={s.cardTitle}>{delivered ? 'Order Delivered' : headerText}</span>
          {delivered && <span style={s.checkBadge}>✓</span>}
        </div>
        <div style={s.subPill}>{delivered ? '🎉 Delivered on time' : `Status: ${STEPS[currentIndex]?.label || 'Processing'}`}</div>

        <div style={s.cardHr} />
        <div style={s.brand}>DEVINE NATURAL FOODS</div>
        <div style={s.itemsLine}>{itemsSummary || 'Your order'}</div>

        <div style={s.trackRow}>
          <span style={s.trackId}>Track #{order.trackId || order.orderId}</span>
          <button onClick={copyTrack} style={s.copyBtn}>{copied ? 'Copied ✓' : 'Copy'}</button>
        </div>
        <div style={s.payPill}>{(order.paymentMethod || 'cod').toUpperCase()} • ₹{order.totalAmount}</div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button onClick={() => setTab('tracking')} style={tab === 'tracking' ? s.tabActive : s.tab}>Tracking</button>
        <button onClick={() => setTab('details')} style={tab === 'details' ? s.tabActive : s.tab}>Order Details</button>
      </div>

      {tab === 'tracking' ? (
        <div style={s.timeline}>
          {STEPS.map((step, i) => {
            const done = i <= currentIndex;
            const ts = updateAt[step.key];
            return (
              <div key={step.key} style={s.step}>
                <div style={{ ...s.dot, background: done ? '#0e7a3b' : '#d1d5db' }}>{done ? '✓' : ''}</div>
                {i < STEPS.length - 1 && <div style={{ ...s.line, background: i < currentIndex ? '#0e7a3b' : '#e5e7eb' }} />}
                <div style={{ paddingBottom: 22 }}>
                  <div style={{ fontWeight: done ? 700 : 500, color: done ? '#111827' : '#9ca3af' }}>{step.label}</div>
                  {ts && <div style={s.ts}>{new Date(ts).toLocaleString('en-IN')}</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={s.details}>
          <div style={s.detailRow}><span>Order ID</span><b>{order.orderId}</b></div>
          <div style={s.detailRow}><span>Track ID</span><b>{order.trackId || '-'}</b></div>
          <div style={s.detailRow}><span>Payment</span><b>{(order.paymentMethod || 'cod').toUpperCase()} • {order.paymentStatus}</b></div>
          <div style={s.detailRow}><span>Delivery to</span><b style={{ textAlign: 'right', maxWidth: 200 }}>{order.deliveryLocation?.address || '-'}</b></div>
          <div style={s.itemsHead}>Items</div>
          {(order.items || []).map((it, idx) => (
            <div key={idx} style={s.itemRow}>
              <span>{it.quantity}× {it.name}</span><b>₹{it.price * it.quantity}</b>
            </div>
          ))}
          <div style={{ ...s.detailRow, marginTop: 8, borderTop: '1px solid #eee', paddingTop: 10 }}>
            <span>Total</span><b>₹{order.totalAmount}</b>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { maxWidth: 480, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', background: '#fff', minHeight: '100vh', paddingBottom: 30, boxSizing: 'border-box', overflowX: 'hidden', width: '100%' },
  center: { display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#555', fontFamily: 'Inter, sans-serif' },
  headerBar: { background: '#0e7a3b', color: '#fff', padding: '16px 20px', textAlign: 'center', boxSizing: 'border-box', width: '100%' },
  headerTitle: { fontSize: 22, fontWeight: 800 },
  etaPill: { display: 'inline-block', marginTop: 8, background: 'rgba(255,255,255,.18)', padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  mapWrap: { height: 360, width: '100%', boxSizing: 'border-box' },
  card: { margin: '-28px 14px 0', position: 'relative', borderRadius: 18, padding: 18, color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,.18)', boxSizing: 'border-box' },
  cardTitleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 22, fontWeight: 800 },
  checkBadge: { background: 'rgba(255,255,255,.25)', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 },
  subPill: { display: 'inline-block', marginTop: 10, background: 'rgba(0,0,0,.18)', padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  cardHr: { height: 1, background: 'rgba(255,255,255,.25)', margin: '14px 0' },
  brand: { fontSize: 15, fontWeight: 800, letterSpacing: 0.3 },
  itemsLine: { fontSize: 13, opacity: 0.92, marginTop: 4 },
  trackRow: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 },
  trackId: { fontSize: 14, fontWeight: 700 },
  copyBtn: { background: 'rgba(255,255,255,.2)', border: 0, color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  payPill: { display: 'inline-block', marginTop: 12, background: 'rgba(0,0,0,.2)', padding: '6px 12px', borderRadius: 8, fontWeight: 700, fontSize: 13 },
  tabs: { display: 'flex', gap: 8, padding: '18px 14px 6px' },
  tab: { flex: 1, padding: '10px', borderRadius: 24, border: 0, background: '#f3f4f6', color: '#374151', fontWeight: 600, cursor: 'pointer' },
  tabActive: { flex: 1, padding: '10px', borderRadius: 24, border: 0, background: '#111827', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  timeline: { padding: '16px 22px' },
  step: { display: 'grid', gridTemplateColumns: '30px 1fr', position: 'relative' },
  dot: { width: 24, height: 24, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, zIndex: 2 },
  line: { position: 'absolute', left: 11, top: 24, width: 2, height: '100%' },
  ts: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  details: { padding: '10px 18px' },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: '#374151' },
  itemsHead: { fontWeight: 700, marginTop: 12, marginBottom: 6, color: '#111827' },
  itemRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#374151' }
};
