import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartDrawer from '../components/CartDrawer';
import AuthModal from '../components/AuthModal';
import CheckoutModal from '../components/CheckoutModal';

export const WA_LINK = 'https://wa.me/919962918979?text=Hi%2C%20I%27m%20interested%20in%20Devine%20products.';
export const LOGO = '/site/logo.svg';
export const PHONES = [
  { label: '99629 18979', tel: '+919962918979' },
  { label: '96772 37465', tel: '+919677237465' }
];

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Products' },
  { to: '/about', label: 'About' },
  { to: '/become-a-dealer', label: 'Become a Dealer' },
  { to: '/career', label: 'Career' },
  { to: '/contact', label: 'Contact' }
];

const WaIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
);

function Header() {
  const [open, setOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  const { cart, setCartOpen, wishlist, user, openAuth, logoutUser } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="logo"><img src={LOGO} alt="Devine" width="140" height="40" /></Link>

        <nav className="nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>{n.label}</NavLink>
          ))}
          <NavLink to="/my-orders" className={({ isActive }) => (isActive ? 'active' : '')}>My Orders</NavLink>
        </nav>

        <div className="header-actions">
          {/* Wishlist Link */}
          <Link to="/wishlist" className="header-icon-btn" aria-label="Wishlist">
            ❤️ {wishlist.length > 0 && <span className="header-badge">{wishlist.length}</span>}
          </Link>

          {/* Cart Button */}
          <button
            className="header-icon-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCartOpen(true);
            }}
            aria-label="Cart"
          >
            🛒 {cartCount > 0 && <span className="header-badge">{cartCount}</span>}
          </button>

          {/* User Account / Auth Button */}
          {user ? (
            <div className="user-menu-wrap">
              <button
                className="user-menu-btn"
                onClick={() => setUserDropdown((v) => !v)}
              >
                👤 {user.name.split(' ')[0]}
              </button>
              {userDropdown && (
                <div className="user-dropdown">
                  <div className="ud-header">
                    <strong>{user.name}</strong>
                    <span>{user.phone}</span>
                  </div>
                  <Link to="/my-orders" onClick={() => setUserDropdown(false)}>📦 My Orders</Link>
                  <Link to="/wishlist" onClick={() => setUserDropdown(false)}>❤️ Wishlist</Link>
                  <button
                    onClick={() => {
                      setUserDropdown(false);
                      logoutUser();
                    }}
                  >
                    🚪 Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-outline nav-auth-btn">
              Log In
            </Link>
          )}

          <Link to="/contact" className="btn btn-primary nav-cta">Enquire</Link>

          <button className="nav-toggle" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      <div className={`mobile-nav${open ? ' open' : ''}`}>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>{n.label}</NavLink>
        ))}
        <NavLink to="/my-orders" onClick={() => setOpen(false)}>My Orders</NavLink>
        <NavLink to="/wishlist" onClick={() => setOpen(false)}>Wishlist ({wishlist.length})</NavLink>
        {user ? (
          <button className="btn btn-outline" onClick={() => { setOpen(false); logoutUser(); }}>Log Out ({user.name})</button>
        ) : (
          <button className="btn btn-outline" onClick={() => { setOpen(false); openAuth('login'); }}>Log In / Sign Up</button>
        )}
        <Link to="/contact" className="btn btn-primary" onClick={() => setOpen(false)}>Enquire Now</Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo"><img src={LOGO} alt="Devine" width="140" height="40" /></div>
            <p>Pure natural products, manufactured with care since 2015. Tamil Nadu, India.</p>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/career">Career</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li><Link to="/products">All Products</Link></li>
              <li><Link to="/my-orders">My Orders</Link></li>
              <li><Link to="/wishlist">Wishlist</Link></li>
              <li><a href={WA_LINK} target="_blank" rel="noreferrer">WhatsApp Us</a></li>
            </ul>
          </div>
          <div>
            <h4>Get in Touch</h4>
            <ul>
              {PHONES.map((p) => <li key={p.tel}><a href={`tel:${p.tel}`}>{p.label}</a></li>)}
              <li>Tamil Nadu, India</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Devine. All rights reserved.</span>
          <span>Created By <a href="https://synhatechnologies.vercel.app/" target="_blank" rel="noreferrer" style={{ color: 'var(--amber)' }}>Synha Technologies Pvt Ltd</a></span>
        </div>
      </div>
    </footer>
  );
}

export function TrustBand({ heading = 'Want to join the Devine family?' }) {
  return (
    <section className="trust-band">
      <h3>{heading}</h3>
      <div className="phones">
        <a href={`tel:${PHONES[0].tel}`}>{PHONES[0].label}</a> &nbsp;·&nbsp; <a href={`tel:${PHONES[1].tel}`}>{PHONES[1].label}</a>
      </div>
    </section>
  );
}

export function AwardBand() {
  return (
    <section className="award-band section-pad">
      <div className="container award-inner">
        <div>
          <h2>Continuous 2016 &amp; 2017 award winner.</h2>
          <p>Named Best Food Products Manufacturer in Tamil Nadu — two years running — for consistency, quality, and a refusal to cut corners.</p>
        </div>
        <div className="laurel">
          <svg viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="110" cy="110" r="104" stroke="#E5A860" strokeWidth="1.5" opacity="0.4" />
            <circle cx="110" cy="110" r="96" stroke="#E5A860" strokeWidth="0.8" opacity="0.25" />
            <g fill="#E5A860">
              <path d="M72 170 Q58 140 52 108 Q48 80 60 52" stroke="#C9A227" strokeWidth="1.2" fill="none" opacity="0.9" />
              <ellipse cx="60" cy="60" rx="9" ry="5" transform="rotate(-55 60 60)" opacity="0.9" />
              <ellipse cx="55" cy="76" rx="9" ry="5" transform="rotate(-65 55 76)" opacity="0.85" />
              <ellipse cx="51" cy="93" rx="9" ry="5" transform="rotate(-70 51 93)" opacity="0.85" />
              <ellipse cx="51" cy="110" rx="9" ry="5" transform="rotate(-75 51 110)" opacity="0.8" />
              <ellipse cx="53" cy="127" rx="9" ry="5" transform="rotate(-70 53 127)" opacity="0.8" />
              <ellipse cx="59" cy="143" rx="9" ry="5" transform="rotate(-60 59 143)" opacity="0.75" />
              <ellipse cx="67" cy="158" rx="9" ry="5" transform="rotate(-50 67 158)" opacity="0.7" />
            </g>
            <g fill="#E5A860">
              <path d="M148 170 Q162 140 168 108 Q172 80 160 52" stroke="#C9A227" strokeWidth="1.2" fill="none" opacity="0.9" />
              <ellipse cx="160" cy="60" rx="9" ry="5" transform="rotate(55 160 60)" opacity="0.9" />
              <ellipse cx="165" cy="76" rx="9" ry="5" transform="rotate(65 165 76)" opacity="0.85" />
              <ellipse cx="169" cy="93" rx="9" ry="5" transform="rotate(70 169 93)" opacity="0.85" />
              <ellipse cx="169" cy="110" rx="9" ry="5" transform="rotate(75 169 110)" opacity="0.8" />
              <ellipse cx="167" cy="127" rx="9" ry="5" transform="rotate(70 167 127)" opacity="0.8" />
              <ellipse cx="161" cy="143" rx="9" ry="5" transform="rotate(60 161 143)" opacity="0.75" />
              <ellipse cx="153" cy="158" rx="9" ry="5" transform="rotate(50 153 158)" opacity="0.7" />
            </g>
            <circle cx="110" cy="105" r="52" fill="rgba(201,162,39,0.08)" stroke="#C9A227" strokeWidth="1" opacity="0.7" />
            <g opacity="0.6" fill="#C9A227">
              <polygon points="110,62 112.5,73 124,68 115,77 124,86 112.5,83 110,94 107.5,83 96,86 105,77 96,68 107.5,73" />
            </g>
          </svg>
          <div className="laurel-content">
            <b>Award Winner</b>
            <span>Best Food Products</span>
            <span>Manufacturer</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WaFloat() {
  return (
    <a href={WA_LINK} className="wa-float" target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"><WaIcon /></a>
  );
}

// Scroll to top on route change.
function ScrollTop() {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [pathname]);
  return null;
}

export default function Layout({ children }) {
  return (
    <>
      <div className="devine-site">
        <ScrollTop />
        <Header />
        {children}
        <Footer />
        <WaFloat />
        <CartDrawer />
      </div>
      <AuthModal />
      <CheckoutModal />
    </>
  );
}
