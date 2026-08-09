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

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      return 'admin';
    }
    return 'home';
  });

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
      if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
        setCurrentPage('admin');
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleOpenEnquiry = (productName) => {
    setEnquiryProduct(productName || 'General Enquiry');
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
          onNavigate={(page) => {
            if (page !== 'contact') {
              setEnquiryProduct('');
            }
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {currentPage === 'products' && (
        <ProductsPage 
          onOpenEnquiry={handleOpenEnquiry}
          onNavigateHome={() => {
            setCurrentPage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {currentPage === 'about' && (
        <AboutPage 
          onNavigateProducts={() => {
            setCurrentPage('products');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
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
          onNavigateHome={() => {
            setCurrentPage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {currentPage === 'home' && (
        <>
          <HeroSection />
          <MarqueeTicker />
          <FlavorShowcase 
            onNavigateProducts={() => {
              setCurrentPage('products');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
          />
        </>
      )}

      {currentPage !== 'admin' && (
        <Footer 
          onOpenSocial={() => setIsSocialOpen(true)} 
          onNavigate={(page) => {
            if (page !== 'contact') {
              setEnquiryProduct('');
            }
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
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
