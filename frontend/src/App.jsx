import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import MarqueeTicker from './components/MarqueeTicker';
import FlavorShowcase from './components/FlavorShowcase';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import SocialModal from './components/SocialModal';
import EnquiryModal from './components/EnquiryModal';
import ProductsPage from './pages/ProductsPage';
import AboutPage from './pages/AboutPage';
import CareerPage from './pages/CareerPage';
import ContactPage from './pages/ContactPage';
import AdminPanel from './pages/AdminPanel';
import Footer from './components/Footer';

// Maps logical pages to URL paths (and back). Product detail uses /product/:id.
const PAGE_PATHS = {
  home: '/',
  products: '/products',
  about: '/about',
  career: '/career',
  contact: '/contact',
  admin: '/admin',
};

function parseLocation() {
  const path = window.location.pathname;
  const productMatch = path.match(/^\/product\/([^/]+)\/?$/);
  if (productMatch) return { page: 'products', productId: productMatch[1] };
  if (path === '/admin' || window.location.hash === '#admin') return { page: 'admin', productId: null };
  const found = Object.entries(PAGE_PATHS).find(([, p]) => p === path);
  if (found) return { page: found[0], productId: null };
  return { page: 'home', productId: null };
}

export default function App() {
  const initialLocation = parseLocation();
  const [currentPage, setCurrentPage] = useState(initialLocation.page);
  const [productId, setProductId] = useState(initialLocation.productId);

  const [cart, setCart] = useState([
    {
      id: "sampler-12",
      title: "Devine Signature Gift Box",
      price: 1099,
      qty: 1,
      img: "/assets/hero.svg"
    }
  ]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [enquiryProduct, setEnquiryProduct] = useState('');

  const cartTotalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  useEffect(() => {
    const handleLocationChange = () => {
      const loc = parseLocation();
      setCurrentPage(loc.page);
      setProductId(loc.productId);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Navigate to a top-level page and reflect it in the URL.
  const goToPage = (page) => {
    if (page !== 'contact') setEnquiryProduct('');
    window.history.pushState({}, '', PAGE_PATHS[page] || '/');
    setProductId(null);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open a product detail page at /product/:id
  const openProduct = (product) => {
    if (!product?._id) return;
    window.history.pushState({}, '', `/product/${product._id}`);
    setProductId(product._id);
    setCurrentPage('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Return from a product detail back to the product list.
  const closeProduct = () => {
    window.history.pushState({}, '', PAGE_PATHS.products);
    setProductId(null);
    setCurrentPage('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEnquiry = (productName) => {
    setEnquiryProduct(productName || 'General Enquiry');
    window.history.pushState({}, '', PAGE_PATHS.contact);
    setProductId(null);
    setCurrentPage('contact');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateQty = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  return (
    <div className="app-root">
      {currentPage !== 'admin' && (
        <Navbar 
          onOpenSocial={() => setIsSocialOpen(true)}
          onOpenCart={() => setIsCartOpen(true)}
          cartCount={cartTotalItems}
          currentPage={currentPage}
          onNavigate={goToPage}
        />
      )}

      {currentPage === 'products' && (
        <ProductsPage 
          onOpenEnquiry={handleOpenEnquiry}
          productId={productId}
          onOpenProduct={openProduct}
          onCloseProduct={closeProduct}
          onNavigateHome={() => goToPage('home')}
        />
      )}

      {currentPage === 'about' && (
        <AboutPage 
          onNavigateProducts={() => goToPage('products')}
        />
      )}

      {currentPage === 'career' && (
        <CareerPage />
      )}

      {currentPage === 'contact' && (
        <ContactPage enquiryProduct={enquiryProduct} />
      )}

      {currentPage === 'admin' && (
        <AdminPanel 
          onNavigateHome={() => goToPage('home')}
        />
      )}

      {currentPage === 'home' && (
        <>
          <HeroSection />
          <MarqueeTicker />
          <FlavorShowcase 
            onNavigateProducts={() => goToPage('products')} 
          />
        </>
      )}

      {currentPage !== 'admin' && (
        <Footer 
          onOpenSocial={() => setIsSocialOpen(true)} 
          onNavigate={goToPage}
          onOpenEnquiry={handleOpenEnquiry}
        />
      )}

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onProceedCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      <SocialModal 
        isOpen={isSocialOpen}
        onClose={() => setIsSocialOpen(false)}
      />

      <EnquiryModal
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
        selectedProduct={enquiryProduct}
      />
    </div>
  );
}
