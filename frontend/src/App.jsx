import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './site/site.css';
import { CartProvider } from './context/CartContext';
import Layout from './site/Layout';
import Home from './site/Home';
import Products from './site/Products';
import ProductDetail from './site/ProductDetail';
import About from './site/About';
import Career from './site/Career';
import Contact from './site/Contact';
import Dealer from './site/Dealer';
import MyOrders from './site/MyOrders';
import WishlistPage from './site/WishlistPage';
import CheckoutPage from './site/CheckoutPage';
import LoginPage from './site/LoginPage';

export default function App() {
  return (
    <CartProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/become-a-dealer" element={<Dealer />} />
          <Route path="/career" element={<Career />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<LoginPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Layout>
    </CartProvider>
  );
}
