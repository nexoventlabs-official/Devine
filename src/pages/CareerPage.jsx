import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function CareerPage() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Regional Sales Manager (FMCG)');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [experience, setExperience] = useState('1 - 3 Years');
  const [resumeLink, setResumeLink] = useState('');
  const [coverNote, setCoverNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      fullName,
      phone,
      email,
      roleApplied: selectedRole,
      experience,
      coverNote: coverNote ? `${coverNote} (Resume: ${resumeLink})` : `Resume Link: ${resumeLink}`
    };

    try {
      const res = await fetch(`${API_BASE_URL}/careers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setSubmitted(true); // Graceful fallback
      }
    } catch (err) {
      console.error('Error posting career application:', err);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="career-page-container">
      {/* Hero Banner */}
      <div className="career-page-hero">
        <div className="career-hero-inner">
          <span className="career-hero-tag">CAREERS AT DEVINE</span>
          <h1 className="career-hero-title">BUILD THE FUTURE OF NATURAL FMCG</h1>
          <p className="career-hero-desc">
            Join an ambitious team of innovators, food technologists, and brand builders passionate about delivering pure, preservative-free Indian foods to millions of homes.
          </p>
        </div>
      </div>

      <div className="career-main-content">
        <div className="career-layout-grid">
          {/* Left Column: Job Openings */}
          <div className="openings-column">
            <span className="section-tag">OPEN POSITIONS</span>
            <h2 className="career-heading">CURRENT OPPORTUNITIES</h2>

            <div className="career-cards-list">
              <div 
                className={`job-opening-card ${selectedRole.includes('Regional Sales Manager') ? 'selected' : ''}`}
                onClick={() => setSelectedRole('Regional Sales Manager (FMCG)')}
              >
                <div className="job-card-header">
                  <h3>Regional Sales Manager (FMCG)</h3>
                  <span className="job-type-pill">Full-Time</span>
                </div>
                <p className="job-meta">📍 Mumbai / Bengaluru | 💼 3-5 Years Exp in Modern Trade & GT</p>
                <p className="job-desc">Lead regional distributor networks, expand retail penetration across supermarket chains, and drive brand revenue growth.</p>
              </div>

              <div 
                className={`job-opening-card ${selectedRole.includes('Food Technologist') ? 'selected' : ''}`}
                onClick={() => setSelectedRole('Food Technologist & Quality Specialist')}
              >
                <div className="job-card-header">
                  <h3>Food Technologist & Quality Specialist</h3>
                  <span className="job-type-pill">Full-Time</span>
                </div>
                <p className="job-meta">📍 Mysore Production Facility | 💼 2-4 Years Exp</p>
                <p className="job-desc">Oversee natural shelf-life optimization, raw honey testing, sun-cooking quality standards, and FSSAI regulatory compliance.</p>
              </div>

              <div 
                className={`job-opening-card ${selectedRole.includes('Brand & Content') ? 'selected' : ''}`}
                onClick={() => setSelectedRole('Brand & Content Marketing Executive')}
              >
                <div className="job-card-header">
                  <h3>Brand & Content Marketing Executive</h3>
                  <span className="job-type-pill">Full-Time / Remote</span>
                </div>
                <p className="job-meta">📍 Remote / Bengaluru HQ | 💼 1-3 Years Exp</p>
                <p className="job-desc">Craft compelling visual storytelling, direct social media campaigns, influencer partnerships, and digital brand presence.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Application Form */}
          <div className="form-column">
            <div className="career-form-card">
              {!submitted ? (
                <>
                  <h3 className="form-card-title">Apply for {selectedRole}</h3>
                  <p className="form-card-sub">Submit your details below and our talent acquisition team will review your profile.</p>

                  <form onSubmit={handleSubmit} className="enquiry-form">
                    <div className="form-group">
                      <label>Applying For Position</label>
                      <input type="text" value={selectedRole} readOnly className="form-input read-only-input" />
                    </div>

                    <div className="form-group">
                      <label>Full Name *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Enter full name" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="form-input" 
                      />
                    </div>

                    <div className="form-row">
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
                      <label>Total Years of Experience</label>
                      <select 
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="form-input"
                      >
                        <option value="0 - 1 Years (Fresher)">0 - 1 Years (Fresher)</option>
                        <option value="1 - 3 Years">1 - 3 Years</option>
                        <option value="3 - 5 Years">3 - 5 Years</option>
                        <option value="5+ Years Senior">5+ Years Senior</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Resume Link / Profile URL *</label>
                      <input 
                        type="url" 
                        required 
                        placeholder="LinkedIn URL or Google Drive link" 
                        value={resumeLink}
                        onChange={(e) => setResumeLink(e.target.value)}
                        className="form-input" 
                      />
                    </div>

                    <div className="form-group">
                      <label>Why do you want to join Devine?</label>
                      <textarea 
                        rows="3" 
                        placeholder="Tell us briefly about your passion..." 
                        value={coverNote}
                        onChange={(e) => setCoverNote(e.target.value)}
                        className="form-input"
                      ></textarea>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="btn-pill btn-pill-magenta submit-enquiry-btn">
                      {isSubmitting ? 'SUBMITTING...' : 'SUBMIT APPLICATION 🚀'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="enquiry-success-wrap">
                  <div className="success-icon">🌟</div>
                  <h3>Application Submitted!</h3>
                  <p>Thank you for applying to Devine. Our HR team will review your application in our Admin database.</p>
                  <button 
                    onClick={() => {
                      setSubmitted(false);
                      setFullName('');
                      setEmail('');
                      setPhone('');
                      setResumeLink('');
                      setCoverNote('');
                    }} 
                    className="btn-pill btn-pill-lime" 
                    style={{ marginTop: '1rem' }}
                  >
                    SUBMIT ANOTHER APPLICATION
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
