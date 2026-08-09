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
    <div style={{ fontFamily: 'Inter, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #eee', display: 'flex', gap: 16, alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Devine CRM</h2>
        <select value={channel} onChange={(e) => setChannel(e.target.value)} style={{ padding: 6, borderRadius: 6 }}>
          <option value="b2b">B2B</option>
          <option value="b2c">B2C</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => setTab('chats')} style={tabBtn(tab === 'chats')}>Chats</button>
          <button onClick={() => setTab('templates')} style={tabBtn(tab === 'templates')}>Templates</button>
        </div>
      </div>

      {tab === 'chats' ? (
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <div style={{ width: 300, borderRight: '1px solid #eee', overflowY: 'auto' }}>
            {threads.map((t) => (
              <div key={t._id} onClick={() => openThread(t._id)}
                style={{ padding: 12, borderBottom: '1px solid #f4f4f4', cursor: 'pointer', background: active === t._id ? '#f0faf3' : '#fff' }}>
                <div style={{ fontWeight: 600 }}>{t.name || t._id}</div>
                <div style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.lastBody}</div>
              </div>
            ))}
            {!threads.length && <div style={{ padding: 16, color: '#999' }}>No conversations yet.</div>}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#f7f7f7' }}>
              {messages.map((m) => (
                <div key={m._id} style={{ display: 'flex', justifyContent: m.direction === 'out' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                  <div style={{ maxWidth: '70%', padding: '8px 12px', borderRadius: 12, background: m.direction === 'out' ? '#dcf8c6' : '#fff', boxShadow: '0 1px 1px rgba(0,0,0,.06)' }}>
                    <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{m.body}</div>
                    <div style={{ fontSize: 10, color: '#999', textAlign: 'right', marginTop: 2 }}>{new Date(m.createdAt).toLocaleTimeString('en-IN')}</div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            {active && (
              <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #eee' }}>
                <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Type a message (within 24h window)…" style={{ flex: 1, padding: 10, borderRadius: 20, border: '1px solid #ddd' }} />
                <button onClick={send} style={btn}>Send</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
            {templates.map((t) => (
              <div key={t._id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700 }}>{t.title}</div>
                <div style={{ fontSize: 13, color: '#666', whiteSpace: 'pre-wrap', margin: '8px 0', maxHeight: 120, overflow: 'hidden' }}>{t.body}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => triggerTemplate(t._id)} style={btn}>Send to one</button>
                  {t.channel !== 'b2c' && <button onClick={() => broadcastToDealers(t._id)} style={{ ...btn, background: '#0b5' }}>Broadcast dealers</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const btn = { background: '#1a7f37', color: '#fff', border: 0, borderRadius: 20, padding: '8px 16px', cursor: 'pointer' };
const tabBtn = (active) => ({ background: active ? '#1a7f37' : '#eee', color: active ? '#fff' : '#333', border: 0, borderRadius: 8, padding: '6px 14px', cursor: 'pointer' });
