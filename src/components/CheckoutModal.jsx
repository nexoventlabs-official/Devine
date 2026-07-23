import React, { useState } from 'react';

export default function CheckoutModal({ isOpen, onClose }) {
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderId, setOrderId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setOrderId(`BLTZ-${Math.floor(100000 + Math.random() * 900000)}`);
    setOrderConfirmed(true);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer' }}
        >
          ✕
        </button>

        {orderConfirmed ? (
          <div style={{ padding: '2rem 0' }}>
            <div style={{ fontSize: '3.5rem', color: '#76f013', marginBottom: '1rem' }}>⚡</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              ORDER CONFIRMED!
            </h3>
            <p style={{ color: '#a0a0a0', marginBottom: '1.5rem' }}>Order #{orderId} is on its way!</p>
            <div style={{ background: 'rgba(118,240,19,0.1)', border: '1px solid #76f013', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', color: '#76f013', fontWeight: '700' }}>
              🚚 Estimated Delivery: 10 Mins via Quick-Commerce Express
            </div>
            <button 
              className="btn-pill btn-pill-lime" 
              onClick={() => {
                setOrderConfirmed(false);
                onClose();
              }}
            >
              Back to Store
            </button>
          </div>
        ) : (
          <>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
              FAST CHECKOUT
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#a0a0a0', fontWeight: '600' }}>FULL NAME</label>
                <input 
                  type="text" 
                  required 
                  style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', marginTop: '4px' }} 
                  placeholder="Naman Sharma" 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#a0a0a0', fontWeight: '600' }}>DELIVERY ADDRESS & PINCODE</label>
                <input 
                  type="text" 
                  required 
                  style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', marginTop: '4px' }} 
                  placeholder="Flat 402, Bandra West, Mumbai - 400050" 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#a0a0a0', fontWeight: '600' }}>PAYMENT METHOD</label>
                <select style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', marginTop: '4px' }}>
                  <option>UPI / GPay / PhonePe / Paytm</option>
                  <option>Credit / Debit Card</option>
                  <option>Cash on Delivery (COD)</option>
                </select>
              </div>
              <button type="submit" className="btn-pill btn-pill-lime" style={{ marginTop: '1rem', width: '100%' }}>
                PLACE ORDER ⚡
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
