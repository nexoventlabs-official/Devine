import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useCart } from '../context/CartContext';
import { TrustBand } from './Layout';

export default function MyOrders() {
  const navigate = useNavigate();
  const { user, openAuth } = useCart();

  const [phoneQuery, setPhoneQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Auto-fetch if user is logged in
  useEffect(() => {
    if (user && (user.phone || user.whatsappPhone)) {
      fetchOrders(user.phone, user.whatsappPhone);
    }
  }, [user]);

  const fetchOrders = async (ph, wa) => {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams();
      if (ph) q.set('phone', ph);
      if (wa) q.set('whatsapp', wa);

      const res = await fetch(`${API_BASE_URL}/orders/my-orders?${q.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!phoneQuery.trim()) return;
    fetchOrders(phoneQuery.trim(), phoneQuery.trim());
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'delivered':
        return <span className="order-badge status-delivered">✓ Delivered</span>;
      case 'out_for_delivery':
        return <span className="order-badge status-out">🚚 Out for Delivery</span>;
      case 'dispatched':
        return <span className="order-badge status-dispatched">📦 Dispatched</span>;
      case 'packed':
        return <span className="order-badge status-packed">🎁 Packed</span>;
      case 'confirmed':
        return <span className="order-badge status-confirmed">👍 Confirmed</span>;
      case 'cancelled':
        return <span className="order-badge status-cancelled">✕ Cancelled</span>;
      default:
        return <span className="order-badge status-pending">⏳ Pending</span>;
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="crumbs"><Link to="/">Home</Link> / My Orders</p>
          <h1>My Orders &amp; Live Tracking</h1>
          <p>Track your web purchases and WhatsApp B2C bot orders in real-time.</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          {/* User Auth Banner or Manual Search */}
          {!user && (
            <div className="orders-guest-bar">
              <div>
                <h3>Already registered with Devine?</h3>
                <p>Log in to view all your order history automatically.</p>
              </div>
              <button className="btn btn-primary" onClick={() => openAuth('login')}>
                Log In / Sign Up
              </button>
            </div>
          )}

          <div className="orders-search-bar">
            <form onSubmit={handleManualSearch} className="orders-search-form">
              <input
                type="tel"
                placeholder="Enter Mobile or WhatsApp Number to search orders…"
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-outline" disabled={loading}>
                {loading ? 'Searching…' : 'Search Orders'}
              </button>
            </form>
          </div>

          {loading ? (
            <div className="site-loader">Fetching your orders…</div>
          ) : error ? (
            <div className="auth-error">{error}</div>
          ) : orders.length === 0 ? (
            <div className="empty-note">
              No orders found. If you placed an order on WhatsApp or Website, search using your mobile number.
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((ord) => (
                <div key={ord._id || ord.orderId} className="order-card">
                  <div className="oc-header">
                    <div>
                      <span className="oc-channel">
                        {ord.channel === 'website' ? '🌐 Website Order' : '💬 WhatsApp Order'}
                      </span>
                      <h3>Order #{ord.orderId}</h3>
                      <span className="oc-date">
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div>{getStatusBadge(ord.status)}</div>
                  </div>

                  <div className="oc-body">
                    <div className="oc-items-preview">
                      {ord.items?.map((item, idx) => (
                        <div key={idx} className="oc-item-row">
                          <span className="oc-item-qty">{item.quantity}x</span>
                          <span className="oc-item-name">{item.name}</span>
                          <span className="oc-item-price">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="oc-summary-line">
                      <span>Payment: <strong>{ord.paymentMethod?.toUpperCase()}</strong> ({ord.paymentStatus})</span>
                      <span className="oc-total-price">Total: ₹{ord.totalAmount}</span>
                    </div>
                  </div>

                  <div className="oc-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/track?order=${ord.trackId || ord.orderId}`)}
                    >
                      📍 Track Order Live
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelectedOrder(ord)}
                    >
                      📄 Order Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content order-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedOrder(null)} aria-label="Close">&times;</button>

            <h2>Order Details (#{selectedOrder.orderId})</h2>
            <p className="od-sub">Tracking Code: <strong>{selectedOrder.trackId}</strong></p>

            <div className="od-section">
              <h4>Customer Details</h4>
              <p><strong>Name:</strong> {selectedOrder.customer?.name || 'N/A'}</p>
              <p><strong>Mobile:</strong> {selectedOrder.customer?.phone}</p>
              {selectedOrder.customer?.whatsappPhone && <p><strong>WhatsApp:</strong> {selectedOrder.customer.whatsappPhone}</p>}
            </div>

            <div className="od-section">
              <h4>Delivery Location</h4>
              <p>{selectedOrder.deliveryLocation?.address || 'Standard Address'}</p>
              {selectedOrder.deliveryLocation?.latitude && (
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-faint)' }}>
                  GPS: {selectedOrder.deliveryLocation.latitude}, {selectedOrder.deliveryLocation.longitude}
                </p>
              )}
            </div>

            <div className="od-section">
              <h4>Item Breakdown</h4>
              <div className="od-items-table">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="od-table-row">
                    <span>{item.name} x {item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="od-table-row">
                  <span>Delivery Charge</span>
                  <span>₹{selectedOrder.deliveryCharge || 0}</span>
                </div>
                <div className="od-table-row od-table-total">
                  <span>Total Amount</span>
                  <span>₹{selectedOrder.totalAmount}</span>
                </div>
              </div>
            </div>

            {selectedOrder.invoicePdfUrl && (
              <div className="od-section">
                <a href={selectedOrder.invoicePdfUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-block">
                  📥 Download Invoice PDF
                </a>
              </div>
            )}

            <div className="od-modal-actions">
              <button
                className="btn btn-primary btn-block"
                onClick={() => {
                  const tId = selectedOrder.trackId || selectedOrder.orderId;
                  setSelectedOrder(null);
                  navigate(`/track?order=${tId}`);
                }}
              >
                Go to Live Tracking Map →
              </button>
            </div>
          </div>
        </div>
      )}

      <TrustBand />
    </>
  );
}
