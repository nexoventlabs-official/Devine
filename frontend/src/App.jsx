import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './site/site.css';
import Layout from './site/Layout';
import Home from './site/Home';
import Products from './site/Products';
import ProductDetail from './site/ProductDetail';
import About from './site/About';
import Career from './site/Career';
import Contact from './site/Contact';
import Dealer from './site/Dealer';

// Public user website (Devine). The admin panel (/admin), CRM (/crn) and live
// tracking (/track) are mounted separately in main.jsx and are unaffected.
export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/become-a-dealer" element={<Dealer />} />
        <Route path="/career" element={<Career />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
  );
}
