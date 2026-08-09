import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import TrackPage from './pages/TrackPage';
import CrmPage from './pages/admin/CrmPage';
import AdminLayout from './pages/admin/AdminLayout';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/track" element={<TrackPage />} />
        <Route path="/crn" element={<CrmPage />} />
        <Route path="/admin/*" element={<AdminLayout />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
