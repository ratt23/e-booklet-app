import React, { useEffect, useState, useCallback } from "react";
import "./SettingsPage.css";

const SettingsPage = () => {
  const [patientBaseUrl, setPatientBaseUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("admin_token");

  const loadSetting = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/.netlify/functions/settings-get", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("404");

      const data = await res.json();
      setPatientBaseUrl(data.patientBaseUrl || "");
    } catch (err) {
      setError("Gagal memuat pengaturan URL terbaru.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSetting();
  }, [loadSetting]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/.netlify/functions/settings-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ patientBaseUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save error");

      setSuccess("Berhasil menyimpan pengaturan.");
    } catch (err) {
      setError("Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-card">
      <h2 className="settings-title">⚙️ Pengaturan Aplikasi</h2>

      {loading && (
        <div className="loading-settings">
          <div className="spinner"></div> Memuat pengaturan...
        </div>
      )}

      {!loading && (
        <>
          {error && <div className="error-box">{error}</div>}
          {success && <div className="success-box">{success}</div>}

          <label className="label">URL Dasar Aplikasi Pasien</label>
          <input
            className="settings-input"
            placeholder="https://app-pasien.domain.com/pasien/"
            value={patientBaseUrl}
            onChange={(e) => setPatientBaseUrl(e.target.value)}
          />

          <button
            className="btn-save"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? "Menyimpan..." : "💾 Simpan Perubahan"}
          </button>
        </>
      )}
    </div>
  );
};

export default SettingsPage;
