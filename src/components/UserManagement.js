import React, { useState, useEffect } from 'react';
import './UserManagement.css';

const UserManagement = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'exporter',
    permissions: {}
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/.netlify/functions/get-all-users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Gagal mengambil data user');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validasi
    if (newPassword !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/.netlify/functions/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: editingUser.username,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Password berhasil diubah untuk user: ${editingUser.username}`);
        setEditingUser(null);
        setNewPassword('');
        setConfirmPassword('');
        // Refresh user list
        fetchUsers();
      } else {
        setError(data.error || 'Gagal mengubah password');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    }
  };

  const handleToggleUserStatus = async (user) => {
    if (user.username === currentUser?.username) {
      setError('Tidak bisa menonaktifkan akun sendiri');
      return;
    }

    const action = user.is_active ? 'menonaktifkan' : 'mengaktifkan';
    if (!window.confirm(`Apakah Anda yakin ingin ${action} user ${user.username}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/.netlify/functions/toggle-user-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: user.username,
          is_active: !user.is_active
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`User ${user.username} berhasil ${user.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
        // Refresh user list
        fetchUsers();
      } else {
        setError(data.error || 'Gagal mengubah status user');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    }
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validasi
    if (newUser.password !== newUser.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (newUser.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    if (!newUser.username.trim()) {
      setError('Username harus diisi');
      return;
    }

    // Set permissions berdasarkan role
    let permissions = {};
    switch (newUser.role) {
      case 'admin':
        permissions = { all_access: true };
        break;
      case 'admin_poc':
        permissions = {
          view_patients: true,
          add_patient: true,
          edit_patient: true,
          delete_patient: true,
          export_csv: true
        };
        break;
      case 'exporter':
        permissions = {
          view_patients: true,
          export_csv: true
        };
        break;
      default:
        permissions = { view_patients: true };
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/.netlify/functions/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUser.username.trim(),
          password: newUser.password,
          role: newUser.role,
          permissions: permissions
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`User ${newUser.username} berhasil dibuat`);
        setShowAddUserForm(false);
        setNewUser({
          username: '',
          password: '',
          confirmPassword: '',
          role: 'exporter',
          permissions: {}
        });
        // Refresh user list
        fetchUsers();
      } else {
        setError(data.error || 'Gagal membuat user');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    }
  };

  const formatPermissions = (permissions) => {
    if (!permissions) return '-';
    
    if (permissions.all_access) {
      return 'Semua Akses';
    }

    const permissionList = [];
    if (permissions.view_patients) permissionList.push('Lihat Pasien');
    if (permissions.add_patient) permissionList.push('Tambah Pasien');
    if (permissions.edit_patient) permissionList.push('Edit Pasien');
    if (permissions.delete_patient) permissionList.push('Hapus Pasien');
    if (permissions.export_csv) permissionList.push('Export CSV');

    return permissionList.length > 0 ? permissionList.join(', ') : 'Tidak ada akses';
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'admin':
        return 'Akses penuh ke semua fitur';
      case 'admin_poc':
        return 'Akses lengkap kecuali impor data external';
      case 'exporter':
        return 'Hanya bisa melihat data dan export CSV';
      default:
        return 'Role tidak dikenali';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Memuat data user...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <div className="header-title">
          <h2>👥 Management User</h2>
          <p>Kelola user dan password sistem e-Booklet</p>
        </div>
        <button 
          onClick={() => setShowAddUserForm(true)}
          className="btn-add-user"
        >
          + Tambah User Baru
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Permissions</th>
              <th>Status</th>
              <th>Tanggal Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className={user.username === currentUser?.username ? 'current-user' : ''}>
                <td>
                  <div className="username-cell">
                    {user.username}
                    {user.username === currentUser?.username && <span className="you-badge">(Anda)</span>}
                  </div>
                </td>
                <td>
                  <div className="role-cell">
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                    <div className="role-description">
                      {getRoleDescription(user.role)}
                    </div>
                  </div>
                </td>
                <td className="permissions-cell">
                  {formatPermissions(user.permissions)}
                </td>
                <td>
                  <span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>
                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td>
                  {new Date(user.created_at).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => handleEditClick(user)}
                      className="btn-edit-password"
                      disabled={!user.is_active}
                      title="Ubah Password"
                    >
                      🔑
                    </button>
                    <button 
                      onClick={() => handleToggleUserStatus(user)}
                      className={`btn-toggle-status ${user.is_active ? 'btn-lock' : 'btn-unlock'}`}
                      disabled={user.username === currentUser?.username}
                      title={user.is_active ? 'Nonaktifkan User' : 'Aktifkan User'}
                    >
                      {user.is_active ? '🔒' : '🔓'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="no-data">
            Tidak ada data user yang ditemukan.
          </div>
        )}
      </div>

      {/* Modal Ubah Password */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content password-modal">
            <h3>🔐 Ubah Password</h3>
            <div className="user-info">
              <p><strong>User:</strong> {editingUser.username}</p>
              <p><strong>Role:</strong> {editingUser.role}</p>
              <p><strong>Permissions:</strong> {formatPermissions(editingUser.permissions)}</p>
            </div>
            
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label htmlFor="newPassword">Password Baru</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru (minimal 6 karakter)"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Konfirmasi Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  required
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={handleCancelEdit}
                  className="btn-cancel"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                >
                  💾 Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah User Baru */}
      {showAddUserForm && (
        <div className="modal-overlay">
          <div className="modal-content add-user-modal">
            <h3>👤 Tambah User Baru</h3>
            
            <form onSubmit={handleAddUserSubmit}>
              <div className="form-group">
                <label htmlFor="newUsername">Username</label>
                <input
                  type="text"
                  id="newUsername"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="Masukkan username (unik)"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newUserRole">Role</label>
                <select
                  id="newUserRole"
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  required
                >
                  <option value="exporter">Exporter (Hanya lihat dan export)</option>
                  <option value="admin_poc">Admin POC (Akses terbatas)</option>
                  <option value="admin">Admin (Akses penuh)</option>
                </select>
                <div className="role-help">
                  {getRoleDescription(newUser.role)}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="newUserPassword">Password</label>
                <input
                  type="password"
                  id="newUserPassword"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Masukkan password (minimal 6 karakter)"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="newUserConfirmPassword">Konfirmasi Password</label>
                <input
                  type="password"
                  id="newUserConfirmPassword"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                  placeholder="Ulangi password"
                  required
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowAddUserForm(false)}
                  className="btn-cancel"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                >
                  👥 Tambah User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Informasi */}
      <div className="info-box">
        <h4>📋 Informasi Management User</h4>
        <div className="info-grid">
          <div className="info-item">
            <strong>🔑 Ubah Password</strong>
            <p>Klik ikon kunci untuk mengubah password user tertentu</p>
          </div>
          <div className="info-item">
            <strong>🔒 Lock/Unlock User</strong>
            <p>Klik ikon kunci untuk menonaktifkan/mengaktifkan user</p>
          </div>
          <div className="info-item">
            <strong>👤 User Baru</strong>
            <p>Gunakan tombol "Tambah User Baru" untuk membuat akun baru</p>
          </div>
          <div className="info-item">
            <strong>⚠️ Keamanan</strong>
            <p>User yang sedang login tidak bisa dinonaktifkan</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;