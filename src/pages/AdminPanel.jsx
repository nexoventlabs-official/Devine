import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export default function AdminPanel({ onNavigateHome }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return Boolean(localStorage.getItem('devine_admin_token'));
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'enquiries' | 'careers'

  // Data states
  const [stats, setStats] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [enquirySearch, setEnquirySearch] = useState('');
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState('All');
  const [careerSearch, setCareerSearch] = useState('');
  const [careerStatusFilter, setCareerStatusFilter] = useState('All');

  const API_BASE = API_BASE_URL;

  useEffect(() => {
    if (isLoggedIn) {
      fetchAdminData();
    }
  }, [isLoggedIn]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch(`${API_BASE}/admin/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      // Fetch enquiries
      const enqRes = await fetch(`${API_BASE}/enquiries`);
      if (enqRes.ok) {
        const enqData = await enqRes.json();
        setEnquiries(enqData.data || []);
      }

      // Fetch careers
      const carRes = await fetch(`${API_BASE}/careers`);
      if (carRes.ok) {
        const carData = await carRes.json();
        setCareers(carData.data || []);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('devine_admin_token', data.token);
        setIsLoggedIn(true);
      } else {
        setLoginError(data.message || 'Invalid Admin credentials! Use username: admin, password: admin');
      }
    } catch (err) {
      // Fallback offline login for local testing
      if (username === 'admin' && password === 'admin') {
        localStorage.setItem('devine_admin_token', 'devine_offline_token');
        setIsLoggedIn(true);
      } else {
        setLoginError('Cannot connect to backend server. Make sure backend is running on port 5000.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('devine_admin_token');
    setIsLoggedIn(false);
  };

  const handleUpdateEnquiryStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/enquiries/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setEnquiries(prev => prev.map(item => item._id === id ? { ...item, status: newStatus } : item));
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to update enquiry status:', err);
    }
  };

  const handleDeleteEnquiry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enquiry record?')) return;
    try {
      const res = await fetch(`${API_BASE}/enquiries/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEnquiries(prev => prev.filter(item => item._id !== id));
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to delete enquiry:', err);
    }
  };

  const handleUpdateCareerStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/careers/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setCareers(prev => prev.map(item => item._id === id ? { ...item, status: newStatus } : item));
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to update career status:', err);
    }
  };

  const handleDeleteCareer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this career application?')) return;
    try {
      const res = await fetch(`${API_BASE}/careers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCareers(prev => prev.filter(item => item._id !== id));
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to delete career:', err);
    }
  };

  // Filtered Enquiries
  const filteredEnquiries = enquiries.filter(item => {
    const matchesStatus = enquiryStatusFilter === 'All' || item.status === enquiryStatusFilter;
    const query = enquirySearch.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(query) ||
                          item.phone.includes(query) ||
                          item.email.toLowerCase().includes(query) ||
                          item.productInquired.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  // Filtered Careers
  const filteredCareers = careers.filter(item => {
    const matchesStatus = careerStatusFilter === 'All' || item.status === careerStatusFilter;
    const query = careerSearch.toLowerCase();
    const matchesSearch = item.fullName.toLowerCase().includes(query) ||
                          item.phone.includes(query) ||
                          item.email.toLowerCase().includes(query) ||
                          item.roleApplied.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  // ==========================================
  // LOGIN VIEW
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <img src="/assets/logo.svg" alt="Devine Logo" style={{ height: '52px', marginBottom: '1.2rem' }} />
            <br />
            <span className="admin-badge">ADMINISTRATION PORTAL</span>
            <h2>Devine Control Panel</h2>
            <p>Please enter your credentials to access business details, customer enquiries, and career applications.</p>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form">
            {loginError && (
              <div className="admin-error-alert">
                ⚠️ {loginError}
              </div>
            )}

            <div className="form-group">
              <label>Admin Username</label>
              <input 
                type="text" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username" 
                className="form-input" 
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password" 
                className="form-input" 
              />
            </div>

            <button type="submit" disabled={isLoggingIn} className="btn-pill btn-pill-lime admin-submit-btn">
              {isLoggingIn ? 'LOGGING IN...' : 'LOGIN TO ADMIN PANEL 🔐'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // LOGGED-IN ADMIN DASHBOARD VIEW
  // ==========================================
  return (
    <div className="admin-dashboard-container">
      {/* Top Admin Navbar (Removed LIVE MONGODB CONNECTED badge) */}
      <header className="admin-header-bar">
        <div className="admin-brand">
          <img src="/assets/logo.svg" alt="Devine Logo" style={{ height: '40px' }} />
        </div>

        <nav className="admin-tab-nav">
          <button 
            className={`admin-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`admin-nav-btn ${activeTab === 'enquiries' ? 'active' : ''}`}
            onClick={() => setActiveTab('enquiries')}
          >
            Enquiry Requests ({enquiries.length})
          </button>
          <button 
            className={`admin-nav-btn ${activeTab === 'careers' ? 'active' : ''}`}
            onClick={() => setActiveTab('careers')}
          >
            Career Applications ({careers.length})
          </button>
        </nav>

        <div className="admin-user-controls">
          <button onClick={handleLogout} className="admin-logout-btn">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="admin-main-body">
        {/* TAB 1: DASHBOARD OVERVIEW (Clean UI & UX) */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-view-wrap">
            <div className="dashboard-welcome-banner">
              <div>
                <h2>Devine Executive Dashboard 🍃</h2>
                <p>Overview of customer product demand, pending inquiries, and career job applications.</p>
              </div>
            </div>

            {/* Clean Metrics Grid */}
            <div className="admin-metrics-grid">
              <div className="metric-card">
                <div className="metric-icon-wrap icon-green">📦</div>
                <div className="metric-data">
                  <span className="metric-num">{stats ? stats.totalEnquiries : enquiries.length}</span>
                  <span className="metric-label">Total Product Enquiries</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrap icon-amber">⏳</div>
                <div className="metric-data">
                  <span className="metric-num">
                    {stats ? stats.pendingEnquiries : enquiries.filter(i => i.status === 'Pending').length}
                  </span>
                  <span className="metric-label">Pending Follow-ups</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrap icon-blue">💼</div>
                <div className="metric-data">
                  <span className="metric-num">{stats ? stats.totalCareers : careers.length}</span>
                  <span className="metric-label">Job Applications</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrap icon-purple">🏆</div>
                <div className="metric-data">
                  <span className="metric-num text-product">
                    {stats?.productBreakdown?.[0]?._id || 'Honey Fig'}
                  </span>
                  <span className="metric-label">Top Demanded Product</span>
                </div>
              </div>
            </div>

            {/* Product Demand Breakdown & Recent Submissions */}
            <div className="dashboard-charts-row">
              {/* Product Demand Card */}
              <div className="admin-section-card">
                <h3>🔥 Product Demand Breakdown</h3>
                <div className="product-demand-list">
                  {stats?.productBreakdown && stats.productBreakdown.length > 0 ? (
                    stats.productBreakdown.map((item, idx) => (
                      <div key={idx} className="product-demand-item">
                        <div className="product-demand-label">
                          <span>{item._id}</span>
                          <strong>{item.count} Enquiries</strong>
                        </div>
                        <div className="demand-bar-bg">
                          <div 
                            className="demand-bar-fill" 
                            style={{ width: `${Math.min(100, (item.count / (stats.totalEnquiries || 1)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-wrap">
                      <p className="empty-text">No product demand data registered yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Enquiries Preview */}
              <div className="admin-section-card">
                <div className="card-header-flex">
                  <h3>Recent Customer Enquiries</h3>
                  <button onClick={() => setActiveTab('enquiries')} className="link-btn">View All →</button>
                </div>
                <div className="mini-table-wrap">
                  {enquiries.length > 0 ? (
                    <table className="admin-table mini-table">
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Product</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enquiries.slice(0, 5).map(item => (
                          <tr key={item._id}>
                            <td>
                              <strong>{item.name}</strong><br />
                              <small className="text-muted">{item.phone}</small>
                            </td>
                            <td><span className="product-tag">{item.productInquired}</span></td>
                            <td><span className={`status-pill ${item.status.toLowerCase()}`}>{item.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state-wrap">
                      <p className="empty-text">No recent enquiries found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ENQUIRY REQUESTS & BUSINESS DETAILS */}
        {activeTab === 'enquiries' && (
          <div className="admin-table-view">
            <div className="table-toolbar">
              <div>
                <h2>Customer Enquiry Requests & Business Details</h2>
                <p>Manage all product enquiries submitted by visitors with duplicate prevention.</p>
              </div>

              <div className="toolbar-controls">
                <input 
                  type="text"
                  placeholder="Search by name, phone, email, product..."
                  value={enquirySearch}
                  onChange={(e) => setEnquirySearch(e.target.value)}
                  className="admin-search-input"
                />

                <select 
                  value={enquiryStatusFilter} 
                  onChange={(e) => setEnquiryStatusFilter(e.target.value)}
                  className="admin-select-filter"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Completed">Completed</option>
                </select>

                <button onClick={fetchAdminData} className="refresh-btn">🔄 Refresh</button>
              </div>
            </div>

            {/* Enquiries Table */}
            <div className="admin-table-container">
              {filteredEnquiries.length > 0 ? (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer Details</th>
                      <th>Contact Info</th>
                      <th>Product Inquired</th>
                      <th>Inquiry Type & Message</th>
                      <th>Date Received</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnquiries.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div className="cust-name"><strong>{item.name}</strong></div>
                        </td>
                        <td>
                          <div>📞 <strong>{item.phone}</strong></div>
                          <div>✉️ {item.email}</div>
                        </td>
                        <td>
                          <span className="product-tag">{item.productInquired}</span>
                        </td>
                        <td>
                          <div className="inquiry-type-text">🏷️ {item.inquiryType}</div>
                          <div className="message-box">{item.message}</div>
                        </td>
                        <td>
                          <small>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
                        </td>
                        <td>
                          <span className={`status-pill ${item.status.toLowerCase()}`}>{item.status}</span>
                        </td>
                        <td>
                          <div className="action-buttons-group">
                            {item.status !== 'Contacted' && (
                              <button 
                                onClick={() => handleUpdateEnquiryStatus(item._id, 'Contacted')}
                                className="action-btn btn-contacted"
                              >
                                Mark Contacted
                              </button>
                            )}
                            {item.status !== 'Completed' && (
                              <button 
                                onClick={() => handleUpdateEnquiryStatus(item._id, 'Completed')}
                                className="action-btn btn-completed"
                              >
                                Mark Completed
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteEnquiry(item._id)}
                              className="action-btn btn-delete"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-records-card">
                  <h3>No enquiry requests match your filter.</h3>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CAREER APPLICATIONS */}
        {activeTab === 'careers' && (
          <div className="admin-table-view">
            <div className="table-toolbar">
              <div>
                <h2>Career & Job Applications</h2>
                <p>View all candidate applications submitted through the Careers page.</p>
              </div>

              <div className="toolbar-controls">
                <input 
                  type="text"
                  placeholder="Search applicant name, role, phone..."
                  value={careerSearch}
                  onChange={(e) => setCareerSearch(e.target.value)}
                  className="admin-search-input"
                />

                <select 
                  value={careerStatusFilter} 
                  onChange={(e) => setCareerStatusFilter(e.target.value)}
                  className="admin-select-filter"
                >
                  <option value="All">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Rejected">Rejected</option>
                </select>

                <button onClick={fetchAdminData} className="refresh-btn">🔄 Refresh</button>
              </div>
            </div>

            {/* Careers Table */}
            <div className="admin-table-container">
              {filteredCareers.length > 0 ? (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Applicant Name</th>
                      <th>Contact Information</th>
                      <th>Role Applied For</th>
                      <th>Experience Level</th>
                      <th>Cover Note / Pitch</th>
                      <th>Date Applied</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCareers.map((item) => (
                      <tr key={item._id}>
                        <td><strong>{item.fullName}</strong></td>
                        <td>
                          <div>📞 <strong>{item.phone}</strong></div>
                          <div>✉️ {item.email}</div>
                        </td>
                        <td><span className="role-tag">{item.roleApplied}</span></td>
                        <td><strong>{item.experience}</strong></td>
                        <td><div className="message-box">{item.coverNote}</div></td>
                        <td>
                          <small>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
                        </td>
                        <td>
                          <span className={`status-pill ${item.status.toLowerCase()}`}>{item.status}</span>
                        </td>
                        <td>
                          <div className="action-buttons-group">
                            <select 
                              value={item.status}
                              onChange={(e) => handleUpdateCareerStatus(item._id, e.target.value)}
                              className="table-select-status"
                            >
                              <option value="New">New</option>
                              <option value="Reviewed">Reviewed</option>
                              <option value="Shortlisted">Shortlisted</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                            <button 
                              onClick={() => handleDeleteCareer(item._id)}
                              className="action-btn btn-delete"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-records-card">
                  <h3>No career applications found.</h3>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
