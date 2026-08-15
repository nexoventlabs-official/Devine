import React from 'react';

// ---- Inline SVG icons (stroke = currentColor / color prop) ----
export const EditIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

export const TrashIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export const CalendarIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export const BoxIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

// Circular icon button used on cards / modal headers.
export function IconBtn({ icon, title, onClick, color = '#ffffff', bg = 'rgba(20,20,20,0.62)', size = 34, border = '1px solid rgba(255,255,255,0.16)' }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{ width: size, height: size, borderRadius: '50%', background: bg, border, color, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, backdropFilter: 'blur(4px)', transition: 'background 0.15s ease' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(40,40,40,0.9)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = bg; }}
    >
      {icon}
    </button>
  );
}

// Themed confirmation dialog (matches admin dark theme).
export function ConfirmModal({ title = 'Are you sure?', message, confirmText = 'Delete', danger = true, busy = false, onConfirm, onCancel }) {
  const accent = danger ? '#f3727f' : '#1ed760';
  return (
    <div style={cOverlay} onClick={onCancel}>
      <div style={cBox} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: danger ? 'rgba(243,114,127,0.15)' : 'rgba(30,215,96,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrashIcon size={20} color={accent} />
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#ffffff' }}>{title}</h3>
        </div>
        {message && <p style={{ color: '#b3b3b3', fontSize: 14, lineHeight: 1.6, margin: '0 0 22px' }}>{message}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={cCancel}>Cancel</button>
          <button type="button" onClick={onConfirm} disabled={busy}
            style={{ ...cConfirm, background: accent, opacity: busy ? 0.6 : 1, cursor: busy ? 'not-allowed' : 'pointer' }}>
            {busy ? 'Working…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

const cOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.78)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 };
const cBox = { background: '#1f1f1f', border: '1px solid #282828', borderRadius: 14, padding: 24, width: 'min(420px, 92vw)', color: '#ffffff', boxShadow: 'rgba(0,0,0,0.6) 0px 12px 40px' };
const cCancel = { padding: '9px 18px', borderRadius: 9999, border: '1px solid #4d4d4d', background: 'transparent', color: '#ffffff', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' };
const cConfirm = { padding: '9px 20px', borderRadius: 9999, border: 0, color: '#000000', fontWeight: 800, fontSize: 12.5 };
