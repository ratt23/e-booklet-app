// src/App.js (VERSI FINAL)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>

          {/* Semua route berhenti di AdminDashboard */}
          <Route path="/*" element={<AdminDashboard />} />

          {/* Redirect root */}
          <Route path="/" element={<Navigate to="/admin" replace />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
