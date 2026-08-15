import React, { useState, useEffect } from 'react';
import { API_BASE_URL, authHeaders } from '../config';

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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Product editor state
  const emptyProduct = {
    name: '', category: '', description: '', shortDesc: '',
    price: '', mrp: '', dealerPrice: '', margin: '', moq: '', unit: 'unit',
    badges: '', featured: false, active: true, imageFile: null, imageUrl: ''
  };
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null=new, else product _id
  const [productForm, setProductForm] = useState(emptyProduct);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productError, setProductError] = useState('');
  const [productSearch, setProductSearch] = useState('');

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

      // Fetch products (all, including inactive)
      const prodRes = await fetch(`${API_BASE}/products?all=true`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.data || []);
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

  // ==========================================
  // PRODUCT HANDLERS
  // ==========================================
  const openNewProduct = () => {
    setEditingProduct(null);
    setProductForm(emptyProduct);
    setProductError('');
    setShowProductForm(true);
  };

  const openEditProduct = (p) => {
    setEditingProduct(p._id);
    setProductForm({
      name: p.name || '', category: p.category || '', description: p.description || '',
      shortDesc: p.shortDesc || '', price: p.price ?? '', mrp: p.mrp ?? '',
      dealerPrice: p.dealerPrice ?? '', margin: p.margin || '', moq: p.moq || '',
      unit: p.unit || 'unit', badges: (p.badges || []).join(', '),
      featured: Boolean(p.featured), active: p.active !== false,
      imageFile: null, imageUrl: p.imageUrl || ''
    });
    setProductError('');
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSavingProduct(true);
    setProductError('');
    try {
      const fd = new FormData();
      fd.append('name', productForm.name);
      fd.append('category', productForm.category);
      fd.append('description', productForm.description);
      fd.append('shortDesc', productForm.shortDesc);
      fd.append('price', productForm.price || 0);
      fd.append('mrp', productForm.mrp || 0);
      fd.append('dealerPrice', productForm.dealerPrice || 0);
      fd.append('margin', productForm.margin);
      fd.append('moq', productForm.moq);
      fd.append('unit', productForm.unit);
      fd.append('badges', productForm.badges);
      fd.append('featured', productForm.featured);
      fd.append('active', productForm.active);
      if (productForm.imageFile) fd.append('image', productForm.imageFile);
      else if (productForm.imageUrl) fd.append('imageUrl', productForm.imageUrl);

      const url = editingProduct ? `${API_BASE}/products/${editingProduct}` : `${API_BASE}/products`;
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { ...authHeaders() }, body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save product');

      setShowProductForm(false);
      setProductForm(emptyProduct);
      setEditingProduct(null);
      fetchAdminData();
    } catch (err) {
      setProductError(err.message || 'Failed to save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product? Its Cloudinary image will also be removed.')) return;
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE', headers: { ...authHeaders() } });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p._id !== id));
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
  });

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
            <img src="/assets/logo.svg" alt="Devine Logo" style={{ height: '48px', marginBottom: '1.2rem' }} />
            <br />
            <span className="admin-badge">ADMINISTRATION PORTAL</span>
            <h2>Devine Control Panel</h2>
            <p>Please enter your credentials to access business details, customer enquiries, and career applications.</p>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form">
            {loginError && (
              <div className="admin-error-alert">
                {loginError}
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

            <button type="submit" disabled={isLoggingIn} className="admin-submit-btn">
              {isLoggingIn ? 'LOGGING IN...' : 'LOGIN TO ADMIN PANEL'}
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
      {/* Top Admin Navbar */}
      <header className="admin-header-bar">
        <div className="admin-brand">
          <img src="/assets/logo.svg" alt="Devine Logo" style={{ height: '36px' }} />
          <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1.5px', color: '#1ed760', textTransform: 'uppercase' }}>ADMIN PANEL</span>
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
            Enquiries ({enquiries.length})
          </button>
          <button 
            className={`admin-nav-btn ${activeTab === 'careers' ? 'active' : ''}`}
            onClick={() => setActiveTab('careers')}
          >
            Careers ({careers.length})
          </button>
          <button
            className={`admin-nav-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Products ({products.length})
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
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-view-wrap">
            <div className="dashboard-welcome-banner">
              <div>
                <h2>Executive Dashboard</h2>
                <p>Overview of customer product demand, pending inquiries, and career job applications.</p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="admin-metrics-grid">
              <div className="metric-card">
                <div className="metric-icon-wrap icon-green">E</div>
                <div className="metric-data">
                  <span className="metric-num">{stats ? stats.totalEnquiries : enquiries.length}</span>
                  <span className="metric-label">Total Product Enquiries</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrap icon-amber">P</div>
                <div className="metric-data">
                  <span className="metric-num">
                    {stats ? stats.pendingEnquiries : enquiries.filter(i => i.status === 'Pending').length}
                  </span>
                  <span className="metric-label">Pending Follow-ups</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrap icon-blue">C</div>
                <div className="metric-data">
                  <span className="metric-num">{stats ? stats.totalCareers : careers.length}</span>
                  <span className="metric-label">Job Applications</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrap icon-purple">T</div>
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
                <h3>Product Demand Breakdown</h3>
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
                <h2>Customer Enquiry Requests</h2>
                <p>Manage product enquiries submitted by site visitors.</p>
              </div>

              <div className="toolbar-controls">
                <input 
                  type="text"
                  placeholder="Search name, phone, email..."
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

                <button onClick={fetchAdminData} className="refresh-btn">Refresh</button>
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
                      <th>Type & Message</th>
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
                          <div><strong>{item.phone}</strong></div>
                          <div className="text-muted">{item.email}</div>
                        </td>
                        <td>
                          <span className="product-tag">{item.productInquired}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1ed760', marginBottom: 4 }}>{item.inquiryType}</div>
                          <div className="message-box">{item.message}</div>
                        </td>
                        <td>
                          <small className="text-muted">{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
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
                                Contacted
                              </button>
                            )}
                            {item.status !== 'Completed' && (
                              <button 
                                onClick={() => handleUpdateEnquiryStatus(item._id, 'Completed')}
                                className="action-btn btn-completed"
                              >
                                Completed
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
                  placeholder="Search applicant, role, phone..."
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

                <button onClick={fetchAdminData} className="refresh-btn">Refresh</button>
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
                      <th>Experience</th>
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
                          <div><strong>{item.phone}</strong></div>
                          <div className="text-muted">{item.email}</div>
                        </td>
                        <td><span className="role-tag">{item.roleApplied}</span></td>
                        <td><strong>{item.experience}</strong></td>
                        <td><div className="message-box">{item.coverNote}</div></td>
                        <td>
                          <small className="text-muted">{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
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

        {/* TAB 4: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="admin-table-view">
            <div className="table-toolbar">
              <div>
                <h2>Product Catalog Management</h2>
                <p>Add, edit and remove products. Images are shown live on the website.</p>
              </div>

              <div className="toolbar-controls">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="admin-search-input"
                />
                <button onClick={fetchAdminData} className="refresh-btn">Refresh</button>
                <button onClick={openNewProduct} className="action-btn btn-completed" style={{ padding: '0.65rem 1.4rem' }}>
                  + Add Product
                </button>
              </div>
            </div>

            <div className="admin-table-container">
              {filteredProducts.length > 0 ? (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Flags</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p._id}>
                        <td>
                          <div style={{ width: '48px', height: '48px', background: '#ffffff', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px', border: '1px solid #333' }}>
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                              <span className="text-muted" style={{ fontSize: '10px' }}>—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <strong>{p.name}</strong>
                          <br />
                          <small className="text-muted">{p.shortDesc || (p.description || '').slice(0, 48)}</small>
                        </td>
                        <td><span className="product-tag">{p.category}</span></td>
                        <td>
                          <strong>₹{p.price}</strong>
                          {p.dealerPrice ? <><br /><small className="text-muted">Dealer ₹{p.dealerPrice}</small></> : null}
                        </td>
                        <td>
                          {p.featured && <span className="status-pill contacted">Featured</span>}{' '}
                          {p.active === false && <span className="status-pill pending">Inactive</span>}
                        </td>
                        <td>
                          <div className="action-buttons-group">
                            <button onClick={() => openEditProduct(p)} className="action-btn btn-contacted">Edit</button>
                            <button onClick={() => handleDeleteProduct(p._id)} className="action-btn btn-delete">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-records-card">
                  <h3>No products yet. Click "+ Add Product" to create one.</h3>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* PRODUCT ADD/EDIT MODAL */}
      {showProductForm && (
        <div className="admin-modal-overlay" onClick={() => setShowProductForm(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="admin-modal-close" onClick={() => setShowProductForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="admin-product-form">
              {productError && <div className="admin-error-alert">{productError}</div>}

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Name *</label>
                  <input className="form-input" required value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <input className="form-input" required list="cat-list" value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
                  <datalist id="cat-list">
                    {Array.from(new Set(products.map((p) => p.category).filter(Boolean))).map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Short Description</label>
                <input className="form-input" value={productForm.shortDesc}
                  onChange={(e) => setProductForm({ ...productForm, shortDesc: e.target.value })} />
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Full Description</label>
                <textarea className="form-input" rows={3} style={{ borderRadius: '12px' }} value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
              </div>

              <div className="form-grid-3" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input className="form-input" type="number" required value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>MRP (₹)</label>
                  <input className="form-input" type="number" value={productForm.mrp}
                    onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Dealer Price (₹)</label>
                  <input className="form-input" type="number" value={productForm.dealerPrice}
                    onChange={(e) => setProductForm({ ...productForm, dealerPrice: e.target.value })} />
                </div>
              </div>

              <div className="form-grid-3" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Margin</label>
                  <input className="form-input" placeholder="20-35%" value={productForm.margin}
                    onChange={(e) => setProductForm({ ...productForm, margin: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>MOQ</label>
                  <input className="form-input" placeholder="50 units" value={productForm.moq}
                    onChange={(e) => setProductForm({ ...productForm, moq: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <input className="form-input" value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Badges / Labels (comma separated)</label>
                <input className="form-input" placeholder="100% Natural, Immunity booster" value={productForm.badges}
                  onChange={(e) => setProductForm({ ...productForm, badges: e.target.value })} />
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: 13, color: '#b3b3b3', fontWeight: 600, marginBottom: 8 }}>
                  Product Image {editingProduct ? '(leave empty to keep current)' : ''}
                </label>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  {(productForm.imageFile || productForm.imageUrl) ? (
                    <img
                      src={productForm.imageFile ? URL.createObjectURL(productForm.imageFile) : productForm.imageUrl}
                      alt="preview"
                      style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: '8px', border: '1px solid #333' }}
                    />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: '8px', background: '#252525', border: '1px dashed #4d4d4d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#7c7c7c' }}>
                      No Image
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px 16px',
                      background: '#282828',
                      color: '#ffffff',
                      border: '1px solid #4d4d4d',
                      borderRadius: 500,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      width: 'fit-content'
                    }}>
                      <span>{productForm.imageFile ? 'Change File' : (productForm.imageUrl ? 'Replace Image' : 'Choose Image')}</span>
                      <input type="file" accept="image/*" onChange={(e) => setProductForm({ ...productForm, imageFile: e.target.files?.[0] || null })} style={{ display: 'none' }} />
                    </label>
                    <span style={{ fontSize: 12, color: productForm.imageFile ? '#1ed760' : '#7c7c7c' }}>
                      {productForm.imageFile ? productForm.imageFile.name : 'PNG, JPG, WebP up to 10MB'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-grid-2" style={{ marginTop: '1rem' }}>
                <label className="admin-checkbox">
                  <input type="checkbox" checked={productForm.featured}
                    onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })} />
                  Featured on homepage
                </label>
                <label className="admin-checkbox">
                  <input type="checkbox" checked={productForm.active}
                    onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })} />
                  Active (visible on site)
                </label>
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="action-btn btn-delete" onClick={() => setShowProductForm(false)}>Cancel</button>
                <button type="submit" disabled={savingProduct} className="action-btn btn-completed">
                  {savingProduct ? 'Saving…' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
