import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../adminApi';

export default function CrmPage() {
  const [channel, setChannel] = useState('b2b');
  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [tab, setTab] = useState('chats');
  const [templates, setTemplates] = useState([]);
  const bottomRef = useRef(null);

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
            {threads.map((t) => (
              <div key={t._id} onClick={() => openThread(t._id)}
                style={{ padding: 14, borderBottom: '1px solid #252525', cursor: 'pointer', background: active === t._id ? '#282828' : 'transparent', borderLeft: active === t._id ? '4px solid #1ed760' : '4px solid transparent' }}>
                <div style={{ fontWeight: 700, color: active === t._id ? '#1ed760' : '#ffffff', fontSize: 14 }}>{t.name || t._id}</div>
                <div style={{ fontSize: 12, color: '#b3b3b3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 3 }}>{t.lastBody}</div>
              </div>
            ))}
            {!threads.length && <div style={{ padding: 20, color: '#b3b3b3', fontSize: 13 }}>No conversations yet.</div>}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#121212' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: '#121212' }}>
              {messages.map((m) => (
                <div key={m._id} style={{ display: 'flex', justifyContent: m.direction === 'out' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                  <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: 16, background: m.direction === 'out' ? '#1ed760' : '#282828', color: m.direction === 'out' ? '#000000' : '#ffffff', boxShadow: 'rgba(0,0,0,0.3) 0px 4px 8px' }}>
                    <div style={{ fontSize: 14, whiteSpace: 'pre-wrap', fontWeight: m.direction === 'out' ? 600 : 400 }}>{m.body}</div>
                    <div style={{ fontSize: 10, color: m.direction === 'out' ? 'rgba(0,0,0,0.6)' : '#b3b3b3', textAlign: 'right', marginTop: 4 }}>{new Date(m.createdAt).toLocaleTimeString('en-IN')}</div>
                  </div>
                </div>
              ))}
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

