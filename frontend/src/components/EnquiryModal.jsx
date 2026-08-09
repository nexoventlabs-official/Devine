import React, { useState } from 'react';

export default function EnquiryModal({ isOpen, onClose, selectedProduct }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    quantity: '10 Tins / Cases',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card enquiry-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>
        
        {!submitted ? (
          <>
            <div className="enquiry-modal-header">
              <span className="modal-tag">ENQUIRY REQUEST</span>
              <h3 className="modal-title">Enquire About {selectedProduct || 'Devine Products'}</h3>
              <p className="modal-subtitle">Fill in your details below to receive wholesale pricing, bulk samples, or distribution information.</p>
            </div>

            <form onSubmit={handleSubmit} className="enquiry-form">
              <div className="form-group">
                <label>Product Name</label>
                <input 
                  type="text" 
                  value={selectedProduct || 'Devine Products'} 
                  readOnly 
                  className="form-input read-only-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Enter your name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="+91 98765 43210" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="name@company.com" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Estimated Quantity</label>
                  <select 
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="form-input"
                  >
                    <option>5 - 20 Tins / Cases</option>
                    <option>20 - 100 Tins / Cases</option>
                    <option>100+ Bulk Wholesale</option>
                    <option>Distribution / Franchise</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Special Instructions / Message</label>
                <textarea 
                  rows="3" 
                  placeholder="Tell us about your requirement or location..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="form-input"
                ></textarea>
              </div>

              <button type="submit" className="btn-pill btn-pill-magenta submit-enquiry-btn">
                SUBMIT ENQUIRY REQUEST 📩
              </button>
            </form>
          </>
        ) : (
          <div className="enquiry-success-wrap">
            <div className="success-icon">🎉</div>
            <h3>Enquiry Submitted Successfully!</h3>
            <p>Thank you for reaching out to Devine. Our sales team will get back to you within 2 business hours with pricing details.</p>
          </div>
        )}
      </div>
    </div>
  );
}
