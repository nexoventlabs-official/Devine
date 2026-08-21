import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { API_BASE_URL } from '../config';
import { useCart } from '../context/CartContext';

export default function AuthModal() {
  const { authOpen, setAuthOpen, authMode, openAuth, loginUser } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login state
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null); // { latitude, longitude, address }
  const [locLoading, setLocLoading] = useState(false);

  if (!authOpen) return null;

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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!loginId || !loginPassword) {
      setError('Please enter your Mobile/Email and Password');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginId, password: loginPassword })
      });
      const data = await res.json();
      if (data.success && data.token) {
        loginUser(data.user, data.token);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error during login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !phone || !password) {
      setError('Name, Mobile Number, and Password are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          whatsappPhone: whatsappPhone || phone,
          email,
          password,
          address,
          location
        })
      });
      const data = await res.json();
      if (data.success && data.token) {
        loginUser(data.user, data.token);
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (err) {
      setError('Network error during signup');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="devine-site modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation();
          setAuthOpen(false);
        }
      }}
    >
      <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setAuthOpen(false)} aria-label="Close">&times;</button>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => { setError(''); openAuth('login'); }}
          >
            Log In
          </button>
          <button
            className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`}
            onClick={() => { setError(''); openAuth('signup'); }}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {authMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="form-group">
              <label>Mobile Number / Email ID *</label>
              <input
                type="text"
                placeholder="Enter mobile number or email"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Logging in…' : 'Log In'}
            </button>
            <p className="auth-switch-text">
              Don't have an account?{' '}
              <button type="button" className="text-link" onClick={() => openAuth('signup')}>
                Sign Up
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mobile Number *</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
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
                  placeholder="Same as mobile or WhatsApp number"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Email ID</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Delivery Address</label>
              <textarea
                placeholder="Door No, Street Name, City, Pincode"
                rows="2"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Live Location (Optional)</label>
              <div className="location-picker-box">
                <button
                  type="button"
                  className="btn btn-outline btn-sm loc-btn"
                  onClick={handleGetLocation}
                  disabled={locLoading}
                >
                  {locLoading ? 'Fetching Location…' : '📍 Share Live Location'}
                </button>
                {location && (
                  <span className="loc-tag">
                    ✓ Location Captured ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})
                  </span>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>

            <p className="auth-switch-text">
              Already have an account?{' '}
              <button type="button" className="text-link" onClick={() => openAuth('login')}>
                Log In
              </button>
            </p>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
