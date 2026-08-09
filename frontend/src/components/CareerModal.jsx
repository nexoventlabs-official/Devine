import React, { useState } from 'react';

export default function CareerModal({ isOpen, onClose }) {
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card career-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>
        
        {!submitted ? (
          <>
            <div className="enquiry-modal-header">
              <span className="modal-tag">CAREERS AT DEVINE</span>
              <h3 className="modal-title">Join Our Passionate Team 🌿</h3>
              <p className="modal-subtitle">We are building India's finest natural FMCG brand. Explore opportunities in Sales, Supply Chain, R&D, and Marketing.</p>
            </div>

            <div className="career-roles-list">
              <div className="career-role-card">
                <h4>Regional Sales Manager</h4>
                <p>Location: Mumbai / Bengaluru | Experience: 3-5 Years FMCG</p>
              </div>
              <div className="career-role-card">
                <h4>Food Technologist & Quality Specialist</h4>
                <p>Location: Mysore Plant | Experience: 2+ Years</p>
              </div>
              <div className="career-role-card">
                <h4>Brand Executive</h4>
                <p>Location: Remote / Delhi | Experience: 1-3 Years</p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="enquiry-form" style={{ marginTop: '1.2rem' }}>
              <div className="form-group">
                <label>Your Full Name</label>
                <input type="text" required placeholder="Enter full name" className="form-input" />
              </div>
              <div className="form-group">
                <label>Email & Phone</label>
                <input type="email" required placeholder="name@email.com" className="form-input" />
              </div>
              <button type="submit" className="btn-pill btn-pill-lime" style={{ width: '100%' }}>
                APPLY NOW / SUBMIT RESUME 🚀
              </button>
            </form>
          </>
        ) : (
          <div className="enquiry-success-wrap">
            <div className="success-icon">🌟</div>
            <h3>Application Received!</h3>
            <p>Thank you for expressing interest in joining Devine. Our HR team will review your application and be in touch soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
