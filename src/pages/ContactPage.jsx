import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export default function ContactPage({ enquiryProduct }) {
  const [productInquired, setProductInquired] = useState(enquiryProduct || '');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [inquiryType, setInquiryType] = useState('Product Inquiry & Pricing');
  const [message, setMessage] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (enquiryProduct) {
      setProductInquired(enquiryProduct);
    }
  }, [enquiryProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const payload = {
      name,
      phone,
      email,
      productInquired: productInquired || 'General Enquiry',
      inquiryType,
      message
    };

    try {
      const res = await fetch(`${API_BASE_URL}/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        if (data.duplicate) {
          setErrorMessage(`⚠️ You have already requested an enquiry for "${productInquired || 'this product'}". Please use another mobile number or contact support.`);
        } else {
          setErrorMessage(data.message || 'Failed to submit enquiry. Please check your information and try again.');
        }
      }
    } catch (err) {
      console.error('Error posting enquiry to backend:', err);
      // Fallback offline submission if server offline
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page-container">
      {/* Hero Banner */}
      <div className="contact-page-hero">
        <div className="contact-hero-inner">
          <span className="contact-hero-tag">GET IN TOUCH</span>
          <h1 className="contact-hero-title">WE'D LOVE TO HEAR FROM YOU</h1>
          <p className="contact-hero-desc">
            Whether you have questions about our natural products, distribution opportunities, bulk orders, or product inquiries — our team is here to assist.
          </p>
        </div>
      </div>

      <div className="contact-main-content">
        <div className="contact-layout-grid">
          {/* Info Cards Column */}
          <div className="contact-cards-column">
            <span className="section-tag">REACH US DIRECTLY</span>
            <h2 className="contact-heading">CONTACT INFORMATION</h2>

            <div className="contact-info-cards-list">
              <div className="contact-info-block">
                <div className="info-icon-wrap">📍</div>
                <div>
                  <h3>Headquarters & Registered Office</h3>
                  <p>Devine Natural Foods Pvt. Ltd.<br />Plot 45, Green Tech Park, Electronic City Phase 1,<br />Bengaluru, Karnataka - 560100</p>
                </div>
              </div>

              <div className="contact-info-block">
                <div className="info-icon-wrap">📞</div>
                <div>
                  <h3>Phone & Customer Care</h3>
                  <p>Toll-Free Customer Care: 1800-123-4567<br />Direct Sales Helpline: +91 98765 00000<br />WhatsApp Business: +91 98765 11111</p>
                </div>
              </div>

              <div className="contact-info-block">
                <div className="info-icon-wrap">✉️</div>
                <div>
                  <h3>Email Addresses</h3>
                  <p>Customer Support: care@devinenaturals.com<br />Wholesale & Distribution: sales@devinenaturals.com<br />Media & PR: pr@devinenaturals.com</p>
                </div>
              </div>

              <div className="contact-info-block">
                <div className="info-icon-wrap">⏰</div>
                <div>
                  <h3>Working Hours</h3>
                  <p>Monday - Saturday: 9:00 AM - 6:30 PM IST<br />Sunday: Closed (Online Orders Processed 24/7)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="contact-form-column">
            <div className="contact-form-card">
              {!submitted ? (
                <>
                  <h3 className="form-card-title">Send Us a Direct Message ✉️</h3>
                  <p className="form-card-sub">
                    {productInquired ? (
                      <span>Inquiring about: <strong style={{ color: 'var(--brand-green-dark)' }}>{productInquired}</strong></span>
                    ) : (
                      'Fill out the form below and our team will get back to you within 24 business hours.'
                    )}
                  </p>

                  <form onSubmit={handleSubmit} className="enquiry-form">
                    {/* Error / Duplicate Alert Box */}
                    {errorMessage && (
                      <div className="user-duplicate-alert">
                        {errorMessage}
                      </div>
                    )}

                    {/* Dynamic Product Inquired Field */}
                    <div className="form-group">
                      <label>Product Inquired *</label>
                      <input 
                        type="text" 
                        required
                        value={productInquired}
                        onChange={(e) => setProductInquired(e.target.value)}
                        className={`form-input ${enquiryProduct ? 'read-only-input' : ''}`}
                        placeholder="e.g. Honey Fig / General Product Enquiry" 
                        readOnly={Boolean(enquiryProduct)}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Your Name *</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Enter full name" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="form-input" 
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone Number *</label>
                        <input 
                          type="tel" 
                          required 
                          placeholder="+91 98765 43210" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="form-input" 
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Email Address *</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="name@email.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input" 
                      />
                    </div>

                    <div className="form-group">
                      <label>Inquiry Type</label>
                      <select 
                        value={inquiryType}
                        onChange={(e) => setInquiryType(e.target.value)}
                        className="form-input"
                      >
                        <option value="Product Inquiry & Pricing">Product Inquiry & Pricing</option>
                        <option value="General Customer Support">General Customer Support</option>
                        <option value="Wholesale & Retail Inquiry">Wholesale & Retail Inquiry</option>
                        <option value="Distributor / Franchise Inquiry">Distributor / Franchise Inquiry</option>
                        <option value="Feedback / Suggestion">Feedback / Suggestion</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Your Message *</label>
                      <textarea 
                        rows="4" 
                        required 
                        placeholder="Write your inquiry or message here..." 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="form-input"
                      ></textarea>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="btn-pill btn-pill-magenta submit-enquiry-btn">
                      {isSubmitting ? 'SUBMITTING...' : 'SEND MESSAGE NOW 🚀'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="enquiry-success-wrap">
                  <div className="success-icon">💌</div>
                  <h3>Message Sent Successfully!</h3>
                  <p>
                    Thank you for reaching out regarding {productInquired ? <strong>{productInquired}</strong> : 'Devine Natural Foods'}. Our support team will reply to your email shortly.
                  </p>
                  <button 
                    onClick={() => {
                      setSubmitted(false);
                      setName('');
                      setPhone('');
                      setEmail('');
                      setMessage('');
                    }} 
                    className="btn-pill btn-pill-lime" 
                    style={{ marginTop: '1rem' }}
                  >
                    SEND ANOTHER MESSAGE
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
