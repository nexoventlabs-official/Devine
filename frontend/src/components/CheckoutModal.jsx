import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function CheckoutModal() {
  const navigate = useNavigate();
  const {
    cart,
    clearCart,
    checkoutOpen,
    setCheckoutOpen,
    user,
    savedAddresses,
    addSavedAddress
  } = useCart();

  const [step, setStep] = useState(1); // 1: Form & Payment, 2: Order Success
  const [selectedAddrIdx, setSelectedAddrIdx] = useState(0);
  const [showAddAnother, setShowAddAnother] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' | 'online'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);

  // Populate initial values from logged-in user or savedAddresses
  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0) {
      const active = savedAddresses[selectedAddrIdx] || savedAddresses[0];
      setName(active.name || (user ? user.name : ''));
      setPhone(active.phone || (user ? user.phone : ''));
      setWhatsappPhone(active.whatsappPhone || (user ? user.whatsappPhone || user?.phone : ''));
      setEmail(active.email || (user ? user.email : ''));
      setAddress(active.address || '');
      setLocation(active.location || null);
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

  if (!checkoutOpen) return null;

  const itemsTotal = cart.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
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
      items: cart,
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
      // Save address for future orders
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
    } else {
      setError(data.message || 'Order creation failed');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !phone || !address) {
      setError('Name, Mobile Number, and Delivery Address are required');
      return;
    }

    setLoading(true);

    try {
      if (paymentMethod === 'online') {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          setError('Razorpay SDK failed to load. Please check connection or try COD.');
          setLoading(false);
          return;
        }

        // Create Razorpay order
        const razorRes = await fetch(`${API_BASE_URL}/payment/create-razorpay-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: totalAmount })
        });
        const razorData = await razorRes.json();

        if (!razorData.success || !razorData.order) {
          setError(razorData.message || 'Failed to initialize online payment');
          setLoading(false);
          return;
        }

        const options = {
          key: razorData.keyId,
          amount: razorData.order.amount,
          currency: razorData.order.currency,
          name: 'Devine Natural Foods',
          description: `Order Payment (Total: ₹${totalAmount})`,
          image: '/site/logo.svg',
          order_id: razorData.order.id,
          prefill: {
            name,
            contact: phone,
            email
          },
          theme: { color: '#C9A227' },
          handler: async function (response) {
            try {
              // Verify payment on backend
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
          setError(resp.error.description || 'Payment failed');
          setLoading(false);
        });
        rzp.open();
      } else {
        // Cash on Delivery
        await submitOrder('');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred during checkout');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setCheckoutOpen(false)}>
      <div className="modal-content checkout-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setCheckoutOpen(false)} aria-label="Close">&times;</button>

        {step === 1 ? (
          <>
            <h2>Checkout Details</h2>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleFormSubmit} className="checkout-form">
              {/* Saved Addresses Section */}
              {savedAddresses.length > 0 && !showAddAnother && (
                <div className="saved-addr-section">
                  <label className="section-label">Select Saved Delivery Address:</label>
                  <div className="saved-addr-list">
                    {savedAddresses.map((addr, idx) => (
                      <div
                        key={idx}
                        className={`saved-addr-card ${selectedAddrIdx === idx ? 'selected' : ''}`}
                        onClick={() => handleSelectSavedAddress(idx)}
                      >
                        <div className="sa-radio">
                          <input
                            type="radio"
                            name="addressSelect"
                            checked={selectedAddrIdx === idx}
                            onChange={() => handleSelectSavedAddress(idx)}
                          />
                        </div>
                        <div className="sa-details">
                          <strong>{addr.name} ({addr.label || 'Saved'})</strong>
                          <p>{addr.address}</p>
                          <span>📞 {addr.phone}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Address Form Fields */}
              {(savedAddresses.length === 0 || showAddAnother) && (
                <div className="addr-fields-wrap">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        placeholder="Recipient Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Mobile Number *</label>
                      <input
                        type="tel"
                        placeholder="Mobile Number"
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
                        placeholder="WhatsApp Number"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email ID</label>
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Complete Delivery Address *</label>
                    <textarea
                      placeholder="Flat/House No, Street, Landmark, Area, City & Pincode"
                      rows="2"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Share Live Location (Optional)</label>
                    <div className="location-picker-box">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm loc-btn"
                        onClick={handleGetLocation}
                        disabled={locLoading}
                      >
                        {locLoading ? 'Capturing Location…' : '📍 Share Live Location'}
                      </button>
                      {location && (
                        <span className="loc-tag">
                          ✓ Location Captured ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Add Another Address Button */}
              {savedAddresses.length > 0 && !showAddAnother && (
                <button
                  type="button"
                  className="btn btn-outline btn-block add-another-addr-btn"
                  onClick={handleAddAnotherAddress}
                >
                  + Add Another Address
                </button>
              )}

              {savedAddresses.length > 0 && showAddAnother && (
                <button
                  type="button"
                  className="text-link show-saved-link"
                  onClick={() => setShowAddAnother(false)}
                >
                  ← Use Saved Address
                </button>
              )}

              {/* Payment Method Selector */}
              <div className="payment-method-section">
                <label className="section-label">Payment Method:</label>
                <div className="payment-options">
                  <label className={`pay-option ${paymentMethod === 'online' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={() => setPaymentMethod('online')}
                    />
                    <div className="pay-content">
                      <strong>Online Payment (Razorpay)</strong>
                      <span>UPI (GPay/PhonePe), Credit/Debit Card, NetBanking</span>
                    </div>
                  </label>

                  <label className={`pay-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                    />
                    <div className="pay-content">
                      <strong>Cash on Delivery (COD)</strong>
                      <span>Pay cash upon doorstep delivery</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Order Summary */}
              <div className="co-summary">
                <div className="co-row">
                  <span>Items ({cart.length})</span>
                  <span>₹{itemsTotal}</span>
                </div>
                <div className="co-row">
                  <span>Delivery Charge</span>
                  <span>{deliveryCharge === 0 ? <strong style={{ color: 'var(--olive-deep)' }}>FREE</strong> : `₹${deliveryCharge}`}</span>
                </div>
                <div className="co-row co-total">
                  <span>Total Amount Payable</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block co-submit-btn" disabled={loading}>
                {loading ? 'Processing Order…' : paymentMethod === 'online' ? `Pay ₹${totalAmount} via Razorpay →` : 'Place Order (COD) →'}
              </button>
            </form>
          </>
        ) : (
          <div className="order-success-box">
            <div className="success-icon">🎉</div>
            <h2>Order Placed Successfully!</h2>
            <p>Thank you for choosing Devine. Your order is being processed.</p>

            {completedOrder && (
              <div className="order-details-card">
                <div className="od-item"><span>Order ID:</span> <strong>{completedOrder.orderId}</strong></div>
                <div className="od-item"><span>Tracking Code:</span> <strong>{completedOrder.trackId}</strong></div>
                <div className="od-item"><span>Total Paid:</span> <strong>₹{completedOrder.totalAmount}</strong></div>
                <div className="od-item"><span>Payment:</span> <strong>{completedOrder.paymentMethod.toUpperCase()}</strong></div>
              </div>
            )}

            <div className="success-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setCheckoutOpen(false);
                  navigate(`/track?order=${completedOrder?.trackId || completedOrder?.orderId}`);
                }}
              >
                📍 Track Order Live
              </button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setCheckoutOpen(false);
                  navigate('/my-orders');
                }}
              >
                📦 View My Orders
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
