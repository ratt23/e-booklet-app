import React, { useState, useEffect, useCallback } from 'react';
import PatientTable from './PatientTable';
import AddPatientForm from './AddPatientForm';
import Login from './Login';
import UserManagement from './UserManagement';
import SettingsPage from './SettingsPage';
import axios from 'axios';
import './AdminDashboard.css';

const PATIENTS_PER_PAGE = 20;

const AdminDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const [activeTab, setActiveTab] = useState('patients');
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('TimestampDibuat');
  const [sortOrder, setSortOrder] = useState('DESC');

  const clearAuthData = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('user_data');
    setIsAuthenticated(false);
    setUser(null);
    setAuthChecked(true);
  }, []);

  const handleLoginSuccess = (data) => {
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('user_data', JSON.stringify(data.user));
    setUser(data.user);
    setIsAuthenticated(true);
    setAuthChecked(true);
    setActiveTab('patients');
    fetchPatients(1);
  };

  const checkAuthStatus = useCallback(() => {
    const token = localStorage.getItem('admin_token');
    const userData = localStorage.getItem('user_data');
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    } else {
      clearAuthData();
    }
    setAuthChecked(true);
    setLoading(false);
  }, [clearAuthData]);

  const fetchPatients = useCallback(async (page) => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        page,
        limit: PATIENTS_PER_PAGE,
        search: searchQuery,
        filterStatus,
        sortBy,
        sortOrder
      });

      const response = await axios.get(
        `/.netlify/functions/get-all-patients?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPatients(response.data?.patients || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setCurrentPage(response.data.pagination?.page || 1);
      setTotalPatients(response.data.pagination?.total || 0);

    } catch (error) {
      console.error(error);
      setError('Gagal memuat data pasien. Silakan coba lagi.');
      if (error.response?.status === 401) clearAuthData();
    } finally {
      setLoading(false);
    }
  }, [
    isAuthenticated,
    searchQuery,
    filterStatus,
    sortBy,
    sortOrder,
    clearAuthData
  ]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'patients') return;
    fetchPatients(currentPage);
  }, [activeTab, currentPage, refreshTrigger, fetchPatients, isAuthenticated]);

  const can = (permission) =>
    user?.permissions?.[permission] === true || user?.permissions?.all_access;

  const handleDeletePatient = async (nomorMR) => {
    if (!window.confirm("Yakin ingin menghapus pasien ini?")) return;

    try {
      const token = localStorage.getItem('admin_token');

      await axios.delete(
        '/.netlify/functions/delete-patient',
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { NomorMR: nomorMR }
        }
      );

      alert("✅ Data pasien berhasil dihapus");
      setRefreshTrigger(Date.now());
    } catch (err) {
      console.error(err);
      alert("❌ Gagal menghapus data pasien");
    }
  };

  if (!authChecked) return <p>Loading...</p>;
  if (!isAuthenticated) return <Login onLoginSuccess={handleLoginSuccess} />;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-info">
          <h1>Admin POC</h1>
          <span className="welcome-text">Welcome, {user?.username} ({user?.role})</span>
        </div>

        <button onClick={clearAuthData} className="btn-logout">Logout</button>
      </div>

      <div className="dashboard-actions-card">
        <div className="actions-left">
          {can('add_patient') && (
            <button
              className="btn-primary"
              onClick={() => { setEditingPatient(null); setShowForm(true); }}>
              ➕ Tambah Pasien
            </button>
          )}

          {can('export_csv') && (
            <button className="btn-primary">
              📊 Export CSV
            </button>
          )}
        </div>

        <div className="tab-navigation">
          {can('view_patients') && (
            <button
              className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
              onClick={() => setActiveTab('patients')}>
              📋 Data Pasien
            </button>
          )}

          {can('manage_users') && (
            <button
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}>
              👥 Management User
            </button>
          )}

          {can('manage_users') && (
            <button
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}>
              ⚙️ Pengaturan
            </button>
          )}
        </div>

      </div>

      <div className="dashboard-content">
        {activeTab === 'patients' && (
          <>
            <div className="dashboard-controls-bar">

              <div className="control-group">
                <label>Cari Pasien (Nama/MR)</label>
                <input
                  type="search"
                  className="control-search"
                  placeholder="Ketik nama atau No. MR..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="control-group">
                <label>Filter Status</label>
                <select
                  className="control-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">Semua Status</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Disetujui">Disetujui</option>
                </select>
              </div>

              <div className="control-group">
                <label>Urutkan Berdasarkan</label>
                <select
                  className="control-select"
                  value={`${sortBy},${sortOrder}`}
                  onChange={(e) => {
                    const [sb, so] = e.target.value.split(',');
                    setSortBy(sb);
                    setSortOrder(so);
                  }}>
                  <option value="TimestampDibuat,DESC">Terbaru Dibuat</option>
                  <option value="TimestampDibuat,ASC">Terlama Dibuat</option>
                  <option value="NamaPasien,ASC">Nama A-Z</option>
                  <option value="NamaPasien,DESC">Nama Z-A</option>
                </select>
              </div>

              <button
                className="btn-refresh"
                onClick={() => setRefreshTrigger(Date.now())}>
                🔄 Refresh
              </button>

            </div>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
              </div>
            ) : (
              <>
                <PatientTable
                  patients={patients}
                  onEdit={(p) => { setEditingPatient(p); setShowForm(true); }}
                  onDelete={handleDeletePatient}
                  currentPage={currentPage}
                  patientsPerPage={PATIENTS_PER_PAGE}
                />

                <div className="pagination-controls">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(currentPage - 1)}>
                    ← Sebelumnya
                  </button>

                  <span className="pagination-info">
                    Halaman {currentPage} dari {totalPages} (Total {totalPatients} pasien)
                  </span>

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}>
                    Berikutnya →
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'users' && <UserManagement currentUser={user} />}
        {activeTab === 'settings' && <SettingsPage />}

      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <AddPatientForm
              editingPatient={editingPatient}
              onSuccess={() => {
                setShowForm(false);
                setRefreshTrigger(Date.now());
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
