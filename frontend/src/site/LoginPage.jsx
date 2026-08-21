import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useCart } from '../context/CartContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialMode = params.get('mode') === 'signup' ? 'signup' : 'login';

  const { loginUser } = useCart();
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form fields
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

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
        navigate('/products');
      } else {
        setError(data.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      setError('Network error during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !phone || !password) {
      setError('Full Name, Mobile Number, and Password are required');
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
        navigate('/products');
      } else {
        setError(data.message || 'Account creation failed');
      }
    } catch (err) {
      setError('Network error during signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page section-pad bg-ivory-deep">
      <div className="container" style={{ maxWidth: 560 }}>
        <div className="crumbs text-center">
          <Link to="/">Home</Link> / <span>Account Access</span>
        </div>

        <div className="login-card-standalone">
          <div className="login-card-header">
            <h1 className="eyebrow" style={{ justifyContent: 'center' }}>Welcome to Devine</h1>
            <h2>{mode === 'login' ? 'Customer Log In' : 'Create Account'}</h2>
            <p>Access your saved addresses, track orders live, and manage wishlists.</p>
          </div>

          <div className="auth-tabs-rich">
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setError(''); setMode('login'); }}
            >
              Log In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setError(''); setMode('signup'); }}
            >
              Sign Up
            </button>
          </div>

          {error && <div className="checkout-alert-error">⚠️ {error}</div>}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="standalone-auth-form">
              <div className="form-group">
                <label>Mobile Number or Email ID *</label>
                <input
                  type="text"
                  placeholder="Enter your registered mobile or email"
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

              <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: 24 }}>
                {loading ? 'Logging in…' : 'Log In to Account →'}
              </button>

              <p className="auth-switch-text mt-lg">
                New customer?{' '}
                <button type="button" className="text-link" onClick={() => { setError(''); setMode('signup'); }}>
                  Create an account
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="standalone-auth-form">
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
                    placeholder="WhatsApp Phone Number"
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
                <label>Password *</label>
                <input
                  type="password"
                  placeholder="Create account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Default Delivery Address</label>
                <textarea
                  placeholder="House No, Building, Street, City & Pincode"
                  rows="2"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
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
                      ✓ Location Captured ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})
                    </span>
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: 24 }}>
                {loading ? 'Creating Account…' : 'Create Account & Continue →'}
              </button>

              <p className="auth-switch-text mt-lg">
                Already have an account?{' '}
                <button type="button" className="text-link" onClick={() => { setError(''); setMode('login'); }}>
                  Log In
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
