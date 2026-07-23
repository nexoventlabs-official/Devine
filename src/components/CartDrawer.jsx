import React, { useState } from 'react';

export default function CartDrawer({ isOpen, onClose, cart, onUpdateQty, onProceedCheckout }) {
  const [promoCode, setPromoCode] = useState('');
  const [discountActive, setDiscountActive] = useState(false);

  const rawSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const subtotal = discountActive ? Math.round(rawSubtotal * 0.9) : rawSubtotal;

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'DEVINE10') {
      setDiscountActive(true);
      alert('🎉 Promo Code DEVINE10 applied! 10% Discount active.');
    } else {
      alert('Invalid Promo Code. Try "DEVINE10" for 10% off!');
    }
  };

  return (
    <div className={`cart-drawer-backdrop ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-drawer-header">
          <h3>YOUR CART 🛒</h3>
          <button className="close-drawer-btn" onClick={onClose}>✕</button>
        </div>

        <div className="cart-drawer-body">
          {cart.length === 0 ? (
            <p style={{ color: '#a0a0a0', textAlign: 'center', marginTop: '2rem' }}>Your cart is empty.</p>
          ) : (
            cart.map(item => (
              <div className="cart-item-row" key={item.id}>
                <img src={item.img} alt={item.title} className="cart-item-img" />
                <div className="cart-item-info">
                  <div className="cart-item-title">{item.title}</div>
                  <div className="cart-item-price">₹{item.price}</div>
                </div>
                <div className="qty-control">
                  <button className="qty-btn" onClick={() => onUpdateQty(item.id, -1)}>-</button>
                  <span>{item.qty}</span>
                  <button className="qty-btn" onClick={() => onUpdateQty(item.id, 1)}>+</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-drawer-footer">
          <div className="promo-box">
            <input 
              type="text" 
              className="promo-input" 
              placeholder="Promo code (e.g. DEVINE10)" 
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
            <button className="btn-pill btn-pill-outline" style={{ padding: '0.4rem 1rem' }} onClick={handleApplyPromo}>
              APPLY
            </button>
          </div>

          <div className="cart-total-row">
            <span>SUBTOTAL:</span>
            <span style={{ color: 'var(--neon-lime)' }}>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>

          <button 
            className="btn-pill btn-pill-lime" 
            style={{ width: '100%' }}
            onClick={() => {
              if (cart.length === 0) return alert('Your cart is empty!');
              onClose();
              onProceedCheckout();
            }}
          >
            PROCEED TO CHECKOUT ⚡
          </button>
        </div>
      </div>
    </div>
  );
}
