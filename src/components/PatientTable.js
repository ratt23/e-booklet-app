import React, { useState } from 'react';
import './PatientTable.css';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'Selamat pagi';
  if (hour >= 11 && hour < 15) return 'Selamat siang';
  if (hour >= 15 && hour < 18) return 'Selamat sore';
  return 'Selamat malam';
};

const fallbackCopyTextToClipboard = (text) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
};

const PatientTable = ({ patients, onEdit, onDelete, currentPage, patientsPerPage }) => {
  const [copiedToken, setCopiedToken] = useState(null);
  const PATIENT_APP_URL = process.env.REACT_APP_PATIENT_URL || 'https://ebookletv1.netlify.app/pasien/';

  const handleCopy = (token) => {
    if (!token) return;
    const link = `${PATIENT_APP_URL}${token}`;
    navigator.clipboard?.writeText(link).catch(() => fallbackCopyTextToClipboard(link));
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleWhatsApp = (token, nama, nomorMR) => {
    if (!token) return;
    const greeting = getGreeting();
    const msg = `${greeting}, ${nama}.\n\nBerikut link booklet persiapan operasi Anda:\n${PATIENT_APP_URL}${token}\n\nTerima kasih.`;
    const waURL = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waURL, '_blank');
  };

  const formatDate = (val) => {
    if (!val) return { d: '-', t: '' };
    const dt = new Date(val);
    return {
      d: dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      t: dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="patient-table-container">
      <table className="patient-table">

        <thead>
          <tr>
            <th>No</th>
            <th>Nomor MR</th>
            <th>Nama Pasien</th>
            <th>Gender</th>
            <th>Umur</th>
            <th>Diagnosa</th>
            <th>Payer</th>
            <th>Kelas</th>
            <th>Skala</th>
            <th>Jadwal Operasi</th>
            <th>Dokter</th>
            <th>Status</th>
            <th>Tindakan</th>
          </tr>
        </thead>

        <tbody>
          {patients.length === 0 ? (
            <tr><td className="no-data" colSpan="13">Tidak ada data.</td></tr>
          ) : (
            patients.map((p, i) => {
              const idx = (currentPage - 1) * patientsPerPage + i + 1;
              const { d, t } = formatDate(p.JadwalOperasi);
              const token = p.TokenAkses;
              return (
                <tr key={p.NomorMR}>
                  <td>{idx}</td>
                  <td>{p.NomorMR}</td>
                  <td>{p.NamaPasien}</td>
                  <td>{p.Gender || '-'}</td>
                  <td>{p.Umur || '-'}</td>
                  <td>{p.Diagnosa || '-'}</td>
                  <td>{p.Payer || '-'}</td>
                  <td>{p.Kelas || '-'}</td>
                  <td>{p.Skala || '-'}</td>
                  <td>
                    <div>{d}</div>
                    {t && <div className="table-time">{t}</div>}
                  </td>
                  <td>{p.Dokter || '-'}</td>

                  <td>
                    <span className={`status-badge ${
                      p.StatusPersetujuan === 'Disetujui' ? 'approved' : 'waiting'
                    }`}>
                      {p.StatusPersetujuan || 'Menunggu'}
                    </span>
                  </td>

                  <td className="table-actions">
                    <button
                      className={`btn-action btn-copy ${copiedToken === token ? 'copied' : ''}`}
                      disabled={!token}
                      onClick={() => handleCopy(token)}
                    >
                      {copiedToken === token ? '✅ Tersalin' : '🔗 Link'}
                    </button>

                    <button
                      className="btn-action btn-wa"
                      disabled={!token}
                      onClick={() => handleWhatsApp(token, p.NamaPasien, p.NomorMR)}
                    >
                      📱 WA
                    </button>

                    <button className="btn-action btn-edit" onClick={() => onEdit(p)}>✏️ Edit</button>
                    <button className="btn-action btn-del" onClick={() => onDelete(p.NomorMR)}>🗑 Hapus</button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>

      </table>
    </div>
  );
};

export default PatientTable;
