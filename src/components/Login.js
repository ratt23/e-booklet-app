// src/components/Login.js
// ✅ VERSI FINAL (Sinkron dengan AdminDashboard.js)
// Menggunakan prop tunggal: onLoginSuccess(data)
// Tanpa dependensi props lain seperti setUser atau setIsAuthenticated

import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  console.log('%c[Login.js] Versi Final Aktif ✅', 'color: lime; font-weight: bold;');
  console.log('[Login Component] Rendering - Received onLoginSuccess type:', typeof onLoginSuccess);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username dan password harus diisi');
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Attempting login for:', username);
      const response = await fetch('/.netlify/functions/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();
      console.log('📨 Login response:', { status: response.status, ok: response.ok, data });

      if (response.ok && data.success) {
        console.log('✅ Login berhasil, memanggil onLoginSuccess...');
        if (typeof onLoginSuccess === 'function') {
          onLoginSuccess(data);
        } else {
          console.error(
            '❌ onLoginSuccess bukan fungsi!',
            onLoginSuccess
          );
          setError('Kesalahan internal: fungsi login tidak ditemukan.');
        }
      } else {
        const errorMsg = data.error || `Login gagal (${response.status})`;
        console.error('❌ Login gagal:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('💥 Network error during login:', err);
      const networkErrorMsg = err.message ? `: ${err.message}` : '';
      setError(`Koneksi jaringan error${networkErrorMsg}. Silakan coba lagi.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <img
          src="/logobaru.png"
          alt="Logo"
          className="login-logo"
        />

        <h2>Admin POC</h2>
        <h3>SURGICAL PREPARATION GUIDE</h3>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="button-spinner"></div>
                Memproses...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
