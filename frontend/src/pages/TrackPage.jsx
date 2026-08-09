import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import { API_BASE_URL, SERVER_ORIGIN } from '../config';

// Lorry SVG marker for the driver
const lorryIcon = L.divIcon({
  className: 'lorry-marker',
  html: `<div style="font-size:0;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3))">
    <svg width="46" height="46" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="20" width="34" height="24" rx="3" fill="#1a7f37"/>
      <path d="M36 26h12l10 10v8H36z" fill="#25913f"/>
      <rect x="40" y="28" width="10" height="8" rx="1.5" fill="#bff0c8"/>
      <circle cx="16" cy="48" r="6" fill="#222"/><circle cx="16" cy="48" r="2.5" fill="#eee"/>
      <circle cx="48" cy="48" r="6" fill="#222"/><circle cx="48" cy="48" r="2.5" fill="#eee"/>
    </svg></div>`,
  iconSize: [46, 46],
  iconAnchor: [23, 40]
});

const homeIcon = L.divIcon({
  className: 'home-marker',
  html: `<div style="font-size:26px">📍</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26]
});
const storeIcon = L.divIcon({
  className: 'store-marker',
  html: `<div style="font-size:24px">🏭</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24]
});

const STEPS = [
  { key: 'confirmed', label: 'Order Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' }
];

function Recenter({ points }) {
  const map = useMap();
  useEffect(() => {
    const valid = points.filter((p) => p && p[0] != null);
    if (valid.length === 1) map.setView(valid[0], 14);
    else if (valid.length > 1) map.fitBounds(valid, { padding: [50, 50] });
  }, [JSON.stringify(points)]);
  return null;
}

export default function TrackPage() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order');
  const phone = params.get('phone');
  const [order, setOrder] = useState(null);
  const [driver, setDriver] = useState(null);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  async function load() {
    try {
      const url = orderId
        ? `${API_BASE_URL}/orders/track/${orderId}`
        : `${API_BASE_URL}/orders/latest/${phone}`;
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

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!order?.orderId) return;
    const socket = io(SERVER_ORIGIN, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.emit('joinOrder', order.orderId);
    socket.on('driver', (loc) => setDriver(loc));
    socket.on('status', (data) => setOrder((o) => ({ ...o, status: data.status, trackingUpdates: data.updates })));
    return () => socket.disconnect();
  }, [order?.orderId]);

  const store = order?.storeLocation || { latitude: 13.0827, longitude: 80.2707 };
  const dest = order?.deliveryLocation;
  const driverPos = driver ? [driver.latitude, driver.longitude] : null;

  const points = useMemo(
    () => [
      [store.latitude, store.longitude],
      driverPos,
      dest ? [dest.latitude, dest.longitude] : null
    ].filter(Boolean),
    [store, driverPos, dest]
  );

  const currentIndex = STEPS.findIndex((s) => s.key === order?.status);
  const updateMap = {};
  (order?.trackingUpdates || []).forEach((u) => (updateMap[u.status] = u.timestamp));

  if (error) return <div style={styles.center}>{error}</div>;
  if (!order) return <div style={styles.center}>Loading your order…</div>;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>Track Order {order.orderId}</h2>
        <span style={styles.badge}>{(order.status || '').replace(/_/g, ' ')}</span>
      </div>

      <div style={styles.mapWrap}>
        <MapContainer center={[store.latitude, store.longitude]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[store.latitude, store.longitude]} icon={storeIcon}>
            <Popup>Devine Store</Popup>
          </Marker>
          {dest && (
            <Marker position={[dest.latitude, dest.longitude]} icon={homeIcon}>
              <Popup>Delivery Location</Popup>
            </Marker>
          )}
          {driverPos && (
            <Marker position={driverPos} icon={lorryIcon}>
              <Popup>Your delivery is on the way</Popup>
            </Marker>
          )}
          {points.length > 1 && <Polyline positions={points} color="#1a7f37" weight={4} dashArray="8 8" />}
          <Recenter points={points} />
        </MapContainer>
      </div>

      {/* Flipkart-style status timeline */}
      <div style={styles.timeline}>
        {STEPS.map((step, i) => {
          const done = i <= currentIndex;
          const ts = updateMap[step.key];
          return (
            <div key={step.key} style={styles.step}>
              <div style={{ ...styles.dot, background: done ? '#1a7f37' : '#ccc' }}>{done ? '✓' : ''}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: done ? 700 : 500, color: done ? '#111' : '#888' }}>{step.label}</div>
                {ts && <div style={styles.ts}>{new Date(ts).toLocaleString('en-IN')}</div>}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ ...styles.connector, background: i < currentIndex ? '#1a7f37' : '#e0e0e0' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 720, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 40 },
  center: { display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#555' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' },
  badge: { background: '#e8f7ec', color: '#1a7f37', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, textTransform: 'capitalize' },
  mapWrap: { height: 380, margin: '0 12px', borderRadius: 16, overflow: 'hidden', border: '1px solid #eee' },
  timeline: { padding: '24px 20px', position: 'relative' },
  step: { display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative', paddingBottom: 22 },
  dot: { width: 26, height: 26, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, zIndex: 2 },
  connector: { position: 'absolute', left: 12, top: 26, width: 2, height: 'calc(100% - 26px)' },
  ts: { fontSize: 12, color: '#999', marginTop: 2 }
};
