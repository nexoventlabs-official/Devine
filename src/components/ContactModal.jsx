import React from 'react';

export default function ContactModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card contact-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>
        
        <div className="enquiry-modal-header">
          <span className="modal-tag">GET IN TOUCH</span>
          <h3 className="modal-title">Contact Devine Headquarters 📞</h3>
          <p className="modal-subtitle">We'd love to hear from you! Reach out for distribution inquiries, customer support, or media requests.</p>
        </div>

        <div className="contact-details-grid">
          <div className="contact-info-card">
            <div className="info-icon">📍</div>
            <div>
              <h4>Headquarters Address</h4>
              <p>Devine Natural Foods Pvt. Ltd.<br />Plot 45, Green Tech Park, Bengaluru, KA - 560100</p>
            </div>
          </div>

          <div className="contact-info-card">
            <div className="info-icon">📞</div>
            <div>
              <h4>Phone & WhatsApp</h4>
              <p>Toll-Free: 1800-123-4567<br />WhatsApp Support: +91 98765 00000</p>
            </div>
          </div>

          <div className="contact-info-card">
            <div className="info-icon">✉️</div>
            <div>
              <h4>Email Support</h4>
              <p>General: care@devinenaturals.com<br />Wholesale: sales@devinenaturals.com</p>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button className="btn-pill btn-pill-magenta" onClick={onClose}>
            CLOSE WINDOW
          </button>
        </div>
      </div>
    </div>
  );
}
