import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../adminApi';

// ---- helpers ---------------------------------------------------------------

// WhatsApp-style day separator (Today / Yesterday / weekday / date).
function dayLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const that = new Date(d); that.setHours(0, 0, 0, 0);
  const diff = Math.round((today - that) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff > 1 && diff < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Escape HTML then apply *bold* and line breaks (XSS-safe).
function formatText(txt) {
  if (!txt) return '';
  let s = String(txt).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  s = s.replace(/\*(.+?)\*/g, '<strong>$1</strong>');
  s = s.replace(/_(.+?)_/g, '<em>$1</em>');
  return s;
}

const money = (n, cur = 'INR') => {
  const sym = cur === 'INR' ? '₹' : (cur + ' ');
  return `${sym}${Number(n || 0).toLocaleString('en-IN')}`;
};

// Delivery tick for outgoing messages.
function DeliveryMark({ status }) {
  if (status === 'failed') return <span style={{ color: '#f3727f', fontWeight: 700 }}> ✕</span>;
  if (status === 'read') return <span style={{ color: '#53bdeb', fontWeight: 700 }}> ✓✓</span>;
  if (status === 'delivered') return <span style={{ color: 'rgba(0,0,0,0.55)', fontWeight: 700 }}> ✓✓</span>;
  return <span style={{ color: 'rgba(0,0,0,0.45)', fontWeight: 700 }}> ✓</span>;
}

// ---- rich renderers --------------------------------------------------------

function OrderCard({ rich, isOut }) {
  return (
    <div style={{ minWidth: 260, maxWidth: 340 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13.5, marginBottom: 8, color: isOut ? '#0a3d20' : '#ffffff' }}>
        🧾 Order · {rich.items.length} item{rich.items.length !== 1 ? 's' : ''}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rich.items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {it.image ? (
              <img src={it.image} alt="" style={{ width: 38, height: 38, borderRadius: 6, objectFit: 'cover', flexShrink: 0, background: '#fff' }} />
            ) : (
              <div style={{ width: 38, height: 38, borderRadius: 6, background: 'rgba(0,0,0,0.12)', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isOut ? '#0a3d20' : '#ffffff' }}>
                {it.name}{it.variantLabel ? ` · ${it.variantLabel}` : ''}
              </div>
              <div style={{ fontSize: 11.5, opacity: 0.75 }}>
                {it.qty} × {money(it.price, it.currency)}
              </div>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 800, flexShrink: 0 }}>{money(it.lineTotal, it.currency)}</div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${isOut ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'}`, marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14 }}>
        <span>Total</span>
        <span>{money(rich.total, rich.currency)}</span>
      </div>
      {rich.note && <div style={{ fontSize: 11.5, opacity: 0.75, marginTop: 6, whiteSpace: 'pre-wrap' }}>{rich.note}</div>}
    </div>
  );
}

function LocationCard({ rich, isOut }) {
  const label = rich.address || rich.name || (rich.latitude != null ? `${rich.latitude}, ${rich.longitude}` : 'Location');
  return (
    <div style={{ minWidth: 220, maxWidth: 300 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13.5, marginBottom: 6 }}>📍 Shared location</div>
      {rich.name && <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{rich.name}</div>}
      <div style={{ fontSize: 12.5, opacity: 0.85, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{label}</div>
      {rich.latitude != null && (
        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{rich.latitude}, {rich.longitude}</div>
      )}
      {rich.mapUrl && (
        <a href={rich.mapUrl} target="_blank" rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, fontWeight: 700, color: isOut ? '#0a5c33' : '#1ed760', textDecoration: 'none' }}>
          🗺️ Open in Google Maps
        </a>
      )}
    </div>
  );
}

function FlowCard({ rich, isOut }) {
  if (!rich.fields.length) return <div style={{ fontSize: 13, fontWeight: 700 }}>📋 Form response</div>;
  return (
    <div style={{ minWidth: 240, maxWidth: 320 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13.5, marginBottom: 8 }}>📋 Form response</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rich.fields.map((f, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12.5 }}>
            <span style={{ opacity: 0.7, flexShrink: 0 }}>{f.label}</span>
            <span style={{ fontWeight: 700, textAlign: 'right', wordBreak: 'break-word' }}>{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- main component --------------------------------------------------------

export default function CrmPage() {
  const [channel, setChannel] = useState('b2b');
  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [tab, setTab] = useState('chats');
  const [templates, setTemplates] = useState([]);
  const bottomRef = useRef(null);
  const activeRef = useRef(null);
  const channelRef = useRef(channel);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { channelRef.current = channel; }, [channel]);

  async function loadThreads() {
    const res = await api.get(`/crm/threads?channel=${channel}`);
    setThreads(res.data || []);
  }
  async function loadTemplates() {
    const res = await api.get(`/crm/templates?channel=${channel}`);
    setTemplates(res.data || []);
  }
  async function openThread(phone) {
    setActive(phone);
    const res = await api.get(`/crm/messages/${phone}?channel=${channel}`);
    setMessages(res.data || []);
    setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
  }
  useEffect(() => { loadThreads(); loadTemplates(); setActive(null); setMessages([]); }, [channel]);

  // Live polling — refresh thread list + open chat silently every 5s.
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const tr = await api.get(`/crm/threads?channel=${channelRef.current}`);
        setThreads(tr.data || []);
      } catch { /* ignore */ }
      const phone = activeRef.current;
      if (phone) {
        try {
          const res = await api.get(`/crm/messages/${phone}?channel=${channelRef.current}`);
          const next = res.data || [];
          setMessages((prev) => {
            const changed = next.length !== prev.length || next[next.length - 1]?._id !== prev[prev.length - 1]?._id;
            return changed ? next : prev;
          });
        } catch { /* ignore */ }
      }
    }, 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  async function send() {
    if (!text.trim() || !active) return;
    await api.post('/crm/send', { channel, phone: active, body: text });
    setText('');
    await openThread(active);
  }

  async function triggerTemplate(id) {
    const phone = active || prompt('Send to phone number:');
    if (!phone) return;
    const res = await api.post(`/crm/templates/${id}/trigger`, { channel, phone });
    alert(`Sent to ${res.sent}/${res.total}`);
    if (active) openThread(active);
  }

  async function broadcastToDealers(id) {
    if (!confirm('Broadcast to all active dealers?')) return;
    const res = await api.post(`/crm/templates/${id}/trigger`, { channel: 'b2b', segment: 'dealers' });
    alert(`Broadcast sent to ${res.sent}/${res.total} dealers`);
  }

  return (
    <div style={{ fontFamily: 'SpotifyMixUI, Inter, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column', background: '#121212', color: '#ffffff' }}>
      <div style={{ padding: '14px 24px', background: '#121212', borderBottom: '1px solid #282828', display: 'flex', gap: 16, alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#ffffff' }}>Devine CRM</h2>
        <select value={channel} onChange={(e) => setChannel(e.target.value)} style={selectStyle}>
          <option value="b2b">B2B Channel</option>
          <option value="b2c">B2C Channel</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button onClick={() => setTab('chats')} style={tabBtn(tab === 'chats')}>Chats</button>
          <button onClick={() => setTab('templates')} style={tabBtn(tab === 'templates')}>Templates</button>
        </div>
      </div>

      {tab === 'chats' ? (
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <div style={{ width: 320, background: '#181818', borderRight: '1px solid #282828', overflowY: 'auto' }}>
            {threads.map((t) => {
              const isActive = active === t._id;
              const initial = (String(t.name || t._id || '#').replace(/[^A-Za-z0-9]/g, '').charAt(0) || '#').toUpperCase();
              return (
                <div key={t._id} onClick={() => openThread(t._id)}
                  style={{ padding: 12, borderBottom: '1px solid #252525', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', background: isActive ? '#282828' : 'transparent', borderLeft: isActive ? '4px solid #1ed760' : '4px solid transparent' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: isActive ? '#1ed760' : '#3a3a3a', color: isActive ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17, flexShrink: 0 }}>{initial}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{ fontWeight: 700, color: isActive ? '#1ed760' : '#ffffff', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name || t._id}</span>
                      <span style={{ fontSize: 10.5, color: '#7c7c7c', flexShrink: 0 }}>{t.lastAt ? new Date(t.lastAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#b3b3b3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 3 }}>
                      {t.lastDirection === 'out' ? '↗ ' : ''}{t.lastBody}
                    </div>
                  </div>
                </div>
              );
            })}
            {!threads.length && <div style={{ padding: 20, color: '#b3b3b3', fontSize: 13 }}>No conversations yet.</div>}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#0b141a' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!active && <div style={{ margin: 'auto', color: '#7c7c7c', fontSize: 14 }}>Select a conversation to view messages</div>}
              {messages.map((m, idx) => {
                const isOut = m.direction === 'out';
                const prev = messages[idx - 1];
                const showDate = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
                const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
                const rich = m.rich;
                const bubbleBg = isOut ? '#005c4b' : '#202c33';
                const bubbleColor = '#e9edef';

                let inner;
                if (rich?.kind === 'order') inner = <OrderCard rich={rich} isOut={false} />;
                else if (rich?.kind === 'location') inner = <LocationCard rich={rich} isOut={false} />;
                else if (rich?.kind === 'flow') inner = <FlowCard rich={rich} isOut={false} />;
                else inner = <div style={{ fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} dangerouslySetInnerHTML={{ __html: formatText(m.body) }} />;

                return (
                  <React.Fragment key={m._id || idx}>
                    {showDate && (
                      <div style={{ alignSelf: 'center', margin: '8px 0', background: '#1d2a32', color: '#8fa3ad', fontSize: 11.5, fontWeight: 700, padding: '4px 12px', borderRadius: 8 }}>
                        {dayLabel(m.createdAt)}
                      </div>
                    )}
                    <div style={{ alignSelf: isOut ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                      <div style={{ background: bubbleBg, color: bubbleColor, borderRadius: isOut ? '10px 10px 2px 10px' : '10px 10px 10px 2px', padding: '8px 11px', boxShadow: '0 1px 1px rgba(0,0,0,0.3)' }}>
                        {inner}
                        <div style={{ textAlign: 'right', fontSize: 10, color: 'rgba(233,237,239,0.55)', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                          {time}{isOut && <DeliveryMark status={m.status} />}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={bottomRef} />
            </div>
            {active && (
              <div style={{ display: 'flex', gap: 10, padding: 16, background: '#181818', borderTop: '1px solid #282828' }}>
                <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Type a message (within 24h window)…" style={msgInput} />
                <button onClick={send} style={btn}>Send</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: 28, background: '#121212' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 18 }}>
            {templates.map((t) => (
              <div key={t._id} style={{ background: '#181818', border: '1px solid #282828', borderRadius: 8, padding: 18, boxShadow: 'rgba(0,0,0,0.3) 0px 8px 8px' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#ffffff' }}>{t.title}</div>
                <div style={{ fontSize: 13, color: '#b3b3b3', whiteSpace: 'pre-wrap', margin: '10px 0', maxHeight: 120, overflow: 'hidden' }}>{t.body}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button onClick={() => triggerTemplate(t._id)} style={{ ...miniBtn, background: '#282828', color: '#ffffff' }}>Send to one</button>
                  {t.channel !== 'b2c' && <button onClick={() => broadcastToDealers(t._id)} style={{ ...miniBtn, background: '#1ed760', color: '#000000' }}>Broadcast dealers</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const selectStyle = { padding: '6px 14px', background: '#1f1f1f', color: '#ffffff', border: '1px solid #333', borderRadius: 500, outline: 'none', fontSize: 12, cursor: 'pointer', fontWeight: 600 };
const msgInput = { flex: 1, padding: '10px 18px', background: '#1f1f1f', border: '1px solid #333', borderRadius: 500, color: '#ffffff', fontSize: 13, outline: 'none' };
const btn = { background: '#1ed760', color: '#000000', border: 0, borderRadius: 9999, padding: '10px 20px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '1.4px', cursor: 'pointer' };
const miniBtn = { border: 0, borderRadius: 9999, padding: '8px 14px', cursor: 'pointer', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' };
const tabBtn = (active) => ({ background: active ? '#1ed760' : '#1f1f1f', color: active ? '#000000' : '#b3b3b3', border: 0, borderRadius: 9999, padding: '8px 18px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' });
