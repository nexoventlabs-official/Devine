import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQuantity, removeFromCart, setCheckoutOpen } = useCart();

  if (!cartOpen) return null;

  const itemsTotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  const deliveryCharge = itemsTotal >= 500 || itemsTotal === 0 ? 0 : 50;
  const totalAmount = itemsTotal + deliveryCharge;

  const handleProceedCheckout = (e) => {
    if (e) e.stopPropagation();
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  return createPortal(
    <div
      className="cart-drawer-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation();
          setCartOpen(false);
        }
      }}
    >
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cd-header">
          <h3>Shopping Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})</h3>
          <button className="cd-close" onClick={() => setCartOpen(false)} aria-label="Close cart">&times;</button>
        </div>

        {cart.length === 0 ? (
          <div className="cd-empty">
            <div className="cd-empty-icon">🛒</div>
            <p>Your cart is empty.</p>
            <Link to="/products" className="btn btn-primary" onClick={() => setCartOpen(false)}>
              Explore Products
            </Link>
          </div>
        ) : (
          <>
            <div className="cd-body">
              {cart.map((item) => (
                <div key={item.key} className="cd-item">
                  <div className="cd-thumb">
                    {item.image ? <img src={item.image} alt={item.name} /> : <div className="cd-no-img">📦</div>}
                  </div>
                  <div className="cd-info">
                    <h4>{item.name}</h4>
                    {item.sizeLabel && <span className="cd-size">{item.sizeLabel}</span>}
                    <div className="cd-price">₹{item.price}</div>
                    <div className="cd-qty-wrap">
                      <div className="cd-qty">
                        <button onClick={() => updateQuantity(item.key, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.key, 1)}>+</button>
                      </div>
                      <button className="cd-remove" onClick={() => removeFromCart(item.key)} aria-label="Remove item">
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="cd-item-total">₹{item.price * item.quantity}</div>
                </div>
              ))}
            </div>

            <div className="cd-footer">
              <div className="cd-row">
                <span>Subtotal</span>
                <span>₹{itemsTotal}</span>
              </div>
              <div className="cd-row">
                <span>Delivery Charge</span>
                <span>{deliveryCharge === 0 ? <strong style={{ color: 'var(--olive-deep, #4F5C38)' }}>FREE</strong> : `₹${deliveryCharge}`}</span>
              </div>
              {deliveryCharge > 0 && (
                <div className="cd-free-shipping-tip">
                  Add ₹{500 - itemsTotal} more for FREE delivery!
                </div>
              )}
              <div className="cd-row cd-total">
                <span>Total Amount</span>
                <span>₹{totalAmount}</span>
              </div>
              <button className="btn btn-primary btn-block cd-checkout-btn" onClick={handleProceedCheckout}>
                Proceed to Checkout →
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
