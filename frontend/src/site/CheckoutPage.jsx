import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useCart } from '../context/CartContext';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    user,
    savedAddresses,
    addSavedAddress
  } = useCart();

  const [step, setStep] = useState(1); // 1: Checkout Form, 2: Success Page
  const [selectedAddrIdx, setSelectedAddrIdx] = useState(0);
  const [showAddAnother, setShowAddAnother] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'cod'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);

  // Populate address and user data
  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0) {
      const active = savedAddresses[selectedAddrIdx] || savedAddresses[0];
      if (active) {
        setName(active.name || (user ? user.name : ''));
        setPhone(active.phone || (user ? user.phone : ''));
        setWhatsappPhone(active.whatsappPhone || (user ? user.whatsappPhone || user?.phone : ''));
        setEmail(active.email || (user ? user.email : ''));
        setAddress(active.address || '');
        setLocation(active.location || null);
      }
    } else if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setWhatsappPhone(user.whatsappPhone || user.phone || '');
      setEmail(user.email || '');
      if (user.addresses && user.addresses[0]) {
        setAddress(user.addresses[0].address || '');
        setLocation(user.addresses[0].location || null);
      }
    }
  }, [user, savedAddresses, selectedAddrIdx]);

  // Price Calculations
  const safePrc = (val) => Number(val) || 0;
  const safeQty = (val) => Math.max(1, Number(val) || 1);

  const itemsTotal = cart.reduce((sum, i) => sum + safePrc(i.price) * safeQty(i.quantity), 0);
  const deliveryCharge = itemsTotal >= 500 || itemsTotal === 0 ? 0 : 50;
  const totalAmount = itemsTotal + deliveryCharge;

  const handleSelectSavedAddress = (idx) => {
    setSelectedAddrIdx(idx);
    setShowAddAnother(false);
    const selected = savedAddresses[idx];
    if (selected) {
      setName(selected.name || name);
      setPhone(selected.phone || phone);
      setWhatsappPhone(selected.whatsappPhone || whatsappPhone);
      setEmail(selected.email || email);
      setAddress(selected.address || address);
      setLocation(selected.location || null);
    }
  };

  const handleAddAnotherAddress = () => {
    setShowAddAnother(true);
    setSelectedAddrIdx(-1);
    setAddress('');
    setLocation(null);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setLocLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          address: `Lat: ${pos.coords.latitude.toFixed(5)}, Lng: ${pos.coords.longitude.toFixed(5)}`
        };
        setLocation(coords);
        setLocLoading(false);
      },
      (err) => {
        setLocLoading(false);
        setError('Location permission denied or unavailable: ' + err.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const submitOrder = async (payRef = '') => {
    const orderData = {
      items: cart.map((i) => ({
        key: i.key,
        productId: i.productId || i._id,
        variantIndex: i.variantIndex,
        name: i.name,
        sizeLabel: i.sizeLabel,
        price: safePrc(i.price),
        quantity: safeQty(i.quantity),
        image: i.image
      })),
      customer: {
        name,
        phone,
        whatsappPhone: whatsappPhone || phone,
        email
      },
      deliveryLocation: {
        address,
        latitude: location?.latitude || null,
        longitude: location?.longitude || null
      },
      paymentMethod,
      paymentRef: payRef,
      deliveryCharge
    };

    const res = await fetch(`${API_BASE_URL}/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    const data = await res.json();
    if (data.success && data.data) {
      addSavedAddress({
        name,
        phone,
        whatsappPhone: whatsappPhone || phone,
        email,
        address,
        location
      });

      clearCart();
      setCompletedOrder(data.data);
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setError(data.message || 'Order creation failed');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (cart.length === 0) {
      setError('Your cart is empty. Please add items before checking out.');
      return;
    }

    if (!name || !phone || !address) {
      setError('Full Name, Mobile Number, and Delivery Address are required.');
      return;
    }

    setLoading(true);

    try {
      if (paymentMethod === 'online') {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          setError('Razorpay SDK failed to load. Please check internet connection or select COD.');
          setLoading(false);
          return;
        }

        const razorRes = await fetch(`${API_BASE_URL}/payment/create-razorpay-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: totalAmount })
        });
        const razorData = await razorRes.json();

        if (!razorData.success || !razorData.order) {
          setError(razorData.message || 'Failed to initialize online payment. Please select Cash on Delivery (COD).');
          setLoading(false);
          return;
        }

        const options = {
          key: razorData.keyId,
          amount: razorData.order.amount,
          currency: razorData.order.currency,
          name: 'Devine Natural & Organic Foods',
          description: `Order Checkout (Total: ₹${totalAmount})`,
          image: '/site/logo.svg',
          order_id: razorData.order.id,
          prefill: {
            name,
            contact: phone,
            email
          },
          theme: { color: '#B8712F' },
          handler: async function (response) {
            try {
              const verifyRes = await fetch(`${API_BASE_URL}/payment/verify-razorpay-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                await submitOrder(response.razorpay_payment_id);
              } else {
                setError('Payment verification failed');
              }
            } catch (err) {
              setError('Payment verification error');
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setError(resp.error?.description || 'Payment transaction failed');
          setLoading(false);
        });
        rzp.open();
      } else {
        await submitOrder('');
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred during checkout');
      setLoading(false);
    }
  };

  if (step === 2 && completedOrder) {
    return (
      <div className="checkout-page section-pad bg-ivory-deep">
        <div className="container">
          <div className="order-success-card">
            <div className="osc-badge">🎉 Order Confirmed!</div>
            <h1>Thank You For Your Order</h1>
            <p>Your order has been placed successfully. We are preparing your fresh natural food items!</p>

            <div className="osc-details">
              <div className="osc-row"><span>Order Reference ID:</span> <strong>{completedOrder.orderId}</strong></div>
              <div className="osc-row"><span>Live Track Code:</span> <strong style={{ color: 'var(--amber-deep)' }}>{completedOrder.trackId}</strong></div>
              <div className="osc-row"><span>Customer Name:</span> <strong>{completedOrder.customer?.name}</strong></div>
              <div className="osc-row"><span>Delivery Address:</span> <strong>{completedOrder.deliveryLocation?.address}</strong></div>
              <div className="osc-row"><span>Total Amount:</span> <strong>₹{completedOrder.totalAmount}</strong></div>
              <div className="osc-row"><span>Payment Method:</span> <strong>{completedOrder.paymentMethod?.toUpperCase()}</strong></div>
            </div>

            <div className="osc-actions">
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/track?order=${completedOrder.trackId || completedOrder.orderId}`)}
              >
                📍 Track Order Live
              </button>
              <button
                className="btn btn-outline"
                onClick={() => navigate('/my-orders')}
              >
                📦 View My Orders
              </button>
              <Link to="/products" className="btn btn-light">
                🛍️ Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page section-pad bg-ivory-deep">
      <div className="container">
        <div className="crumbs">
          <Link to="/">Home</Link> / <Link to="/products">Products</Link> / <span>Checkout</span>
        </div>

        <div className="page-header text-center" style={{ marginBottom: 36 }}>
          <h1 className="eyebrow" style={{ justifyContent: 'center' }}>Secure Checkout</h1>
          <h2 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            Complete Your Order
          </h2>
          <p style={{ color: 'var(--ink-soft)', marginTop: 8 }}>
            Enter your delivery location and select your preferred payment method.
          </p>
        </div>

        {cart.length === 0 ? (
          <div className="checkout-empty-card">
            <div className="cec-icon">🛒</div>
            <h3>Your Cart is Currently Empty</h3>
            <p>Please add products to your cart before proceeding to checkout.</p>
            <Link to="/products" className="btn btn-primary mt-lg">
              Explore Fresh Products →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit}>
            {error && <div className="checkout-alert-error">⚠️ {error}</div>}

            <div className="co-grid">
              {/* Left Column: Delivery & Payment Details */}
              <div className="co-left">
                {/* 1. Address Section */}
                <div className="co-card">
                  <div className="co-card-header">
                    <span className="co-step-num">1</span>
                    <h3>Delivery Address</h3>
                  </div>

                  {savedAddresses.length > 0 && !showAddAnother && (
                    <div className="saved-addr-block">
                      <label className="co-label">Select Saved Delivery Address:</label>
                      <div className="saved-addr-grid">
                        {savedAddresses.map((addr, idx) => (
                          <div
                            key={idx}
                            className={`saved-addr-tile ${selectedAddrIdx === idx ? 'active' : ''}`}
                            onClick={() => handleSelectSavedAddress(idx)}
                          >
                            <input
                              type="radio"
                              name="addrChoice"
                              checked={selectedAddrIdx === idx}
                              onChange={() => handleSelectSavedAddress(idx)}
                            />
                            <div className="sat-info">
                              <strong>{addr.name || 'Saved Address'}</strong>
                              <p>{addr.address}</p>
                              <span>📞 {addr.phone}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="btn btn-outline btn-sm add-another-btn"
                        onClick={handleAddAnotherAddress}
                      >
                        + Add Another Delivery Address
                      </button>
                    </div>
                  )}

                  {(savedAddresses.length === 0 || showAddAnother) && (
                    <div className="co-form-fields">
                      {savedAddresses.length > 0 && (
                        <button
                          type="button"
                          className="text-link back-to-saved-link"
                          onClick={() => setShowAddAnother(false)}
                        >
                          ← Select From Saved Addresses
                        </button>
                      )}

                      <div className="form-row">
                        <div className="form-group">
                          <label>Full Name *</label>
                          <input
                            type="text"
                            placeholder="Recipient Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Mobile Number *</label>
                          <input
                            type="tel"
                            placeholder="10-digit mobile number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>WhatsApp Number</label>
                          <input
                            type="tel"
                            placeholder="WhatsApp Number (for live tracking updates)"
                            value={whatsappPhone}
                            onChange={(e) => setWhatsappPhone(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Email Address</label>
                          <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Complete Delivery Address *</label>
                        <textarea
                          placeholder="Flat/House No, Building, Street, Landmark, City & Pincode"
                          rows="3"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Share Live Location (Optional)</label>
                        <div className="location-box-rich">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={handleGetLocation}
                            disabled={locLoading}
                          >
                            {locLoading ? 'Capturing Location…' : '📍 Share Current GPS Location'}
                          </button>
                          {location && (
                            <span className="loc-badge-rich">
                              ✓ Location Stamped ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Payment Selector Section */}
                <div className="co-card">
                  <div className="co-card-header">
                    <span className="co-step-num">2</span>
                    <h3>Select Payment Method</h3>
                  </div>

                  <div className="pay-method-grid">
                    <label className={`pay-tile-rich ${paymentMethod === 'online' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="payMethod"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={() => setPaymentMethod('online')}
                      />
                      <div className="ptr-content">
                        <div className="ptr-header">
                          <strong>Online Payment (Razorpay)</strong>
                          <span className="ptr-badge">Recommended</span>
                        </div>
                        <p>Pay securely via UPI (Google Pay, PhonePe, Paytm), Credit/Debit Card, or NetBanking</p>
                        <div className="ptr-logos">
                          <span>💳 Cards</span>
                          <span>📱 UPI</span>
                          <span>🏦 NetBanking</span>
                        </div>
                      </div>
                    </label>

                    <label className={`pay-tile-rich ${paymentMethod === 'cod' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="payMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                      />
                      <div className="ptr-content">
                        <div className="ptr-header">
                          <strong>Cash on Delivery (COD)</strong>
                        </div>
                        <p>Pay cash when your fresh natural products are delivered to your doorstep</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Sticky Cart Items & Summary */}
              <div className="co-right-sticky">
                <div className="co-card summary-card">
                  <div className="summary-header">
                    <h3>Order Items ({cart.reduce((sum, i) => sum + safeQty(i.quantity), 0)})</h3>
                    <Link to="/products" className="edit-cart-link">Add More Items</Link>
                  </div>

                  <div className="checkout-items-list">
                    {cart.map((item, idx) => {
                      const itemKey = item.key || item.productId || item._id || `co_${idx}`;
                      const priceNum = safePrc(item.price);
                      const qtyNum = safeQty(item.quantity);
                      const rowTotal = priceNum * qtyNum;

                      return (
                        <div key={itemKey} className="co-item-row">
                          <div className="co-item-thumb">
                            {item.image ? <img src={item.image} alt={item.name} /> : <div className="co-no-img">📦</div>}
                          </div>
                          <div className="co-item-info">
                            <h4>{item.name}</h4>
                            {item.sizeLabel && <span className="co-item-size">{item.sizeLabel}</span>}
                            <div className="co-item-unit-price">₹{priceNum} each</div>

                            <div className="co-qty-controls">
                              <button type="button" onClick={() => updateQuantity(itemKey, -1)}>-</button>
                              <span>{qtyNum}</span>
                              <button type="button" onClick={() => updateQuantity(itemKey, 1)}>+</button>
                              <button type="button" className="co-item-del" onClick={() => removeFromCart(itemKey)} title="Remove">
                                🗑️
                              </button>
                            </div>
                          </div>
                          <div className="co-item-total">₹{rowTotal}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="co-price-breakdown">
                    <div className="pb-row">
                      <span>Subtotal</span>
                      <span>₹{itemsTotal}</span>
                    </div>
                    <div className="pb-row">
                      <span>Delivery Fee</span>
                      <span>{deliveryCharge === 0 ? <strong style={{ color: 'var(--olive-deep)' }}>FREE</strong> : `₹${deliveryCharge}`}</span>
                    </div>
                    {deliveryCharge > 0 && (
                      <div className="free-shipping-progress">
                        Add ₹{500 - itemsTotal} more for FREE delivery!
                      </div>
                    )}
                    <div className="pb-row pb-total">
                      <span>Total Amount Payable</span>
                      <span>₹{totalAmount}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-block place-order-btn"
                    disabled={loading}
                  >
                    {loading
                      ? 'Processing Order…'
                      : paymentMethod === 'online'
                      ? `Pay ₹${totalAmount} via Razorpay →`
                      : `Place Order (COD) — ₹${totalAmount} →`}
                  </button>

                  <div className="trust-badges-mini">
                    <span>🔒 100% Encrypted & Safe</span>
                    <span>🌿 Pure Mountain Quality</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
