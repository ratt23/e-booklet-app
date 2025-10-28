import React, { useState, useEffect } from "react";
import "./AddPatientForm.css";

const AddPatientForm = ({
  onSuccess,
  onCancel,
  editingPatient = null
}) => {
  const isEditMode = Boolean(editingPatient);

  const [formData, setFormData] = useState({
    NomorMR: "",
    NamaPasien: "",
    Gender: "",
    Umur: "",
    Diagnosa: "",
    Payer: "",
    Kelas: "",
    Skala: "",
    Dokter: "",
    JadwalOperasi: ""
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (editingPatient) {
      setFormData({
        NomorMR: editingPatient.NomorMR || "",
        NamaPasien: editingPatient.NamaPasien || "",
        Gender: editingPatient.Gender || "",
        Umur: editingPatient.Umur || "",
        Diagnosa: editingPatient.Diagnosa || "",
        Payer: editingPatient.Payer || "",
        Kelas: editingPatient.Kelas || "",
        Skala: editingPatient.Skala || "",
        Dokter: editingPatient.Dokter || "",
        JadwalOperasi: editingPatient.JadwalOperasi
          ? editingPatient.JadwalOperasi.substring(0, 16)
          : ""
      });
    }
  }, [editingPatient]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validation basic: MR numeric only
    if (name === "NomorMR" && !/^[0-9]*$/.test(value)) return;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.NomorMR || !formData.NamaPasien) {
      setErrorMsg("Nomor MR & Nama Pasien harus diisi.");
      return;
    }

    setLoading(true);
    try {
      console.log("📌 Submit patient data:", formData);
      onSuccess(formData);
    } catch (err) {
      setErrorMsg("Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="add-patient-form" onSubmit={handleSubmit}>
      {/* ❌ Close Button */}
      <button type="button" className="close-btn" onClick={onCancel}>
        ×
      </button>

      <h3>{isEditMode ? "Edit Data Pasien" : "Formulir Pasien Baru"}</h3>

      {errorMsg && <div className="form-error">{errorMsg}</div>}

      <div className="form-grid">

        {/* Nomor MR */}
        <div className="form-group">
          <label>Nomor MR</label>
          <input
            name="NomorMR"
            placeholder="Contoh: 123456"
            value={formData.NomorMR}
            onChange={handleChange}
            required
          />
        </div>

        {/* Nama Pasien */}
        <div className="form-group">
          <label>Nama Pasien</label>
          <input
            name="NamaPasien"
            placeholder="Contoh: Raditya Putra"
            value={formData.NamaPasien}
            onChange={handleChange}
            required
          />
        </div>

        {/* Jadwal Operasi */}
        <div className="form-group">
          <label>Jadwal Operasi (Tanggal & Waktu)</label>
          <input
            type="datetime-local"
            name="JadwalOperasi"
            value={formData.JadwalOperasi}
            onChange={handleChange}
          />
        </div>

        {/* Dokter */}
        <div className="form-group">
          <label>Dokter</label>
          <input
            name="Dokter"
            placeholder="Contoh: Dr. John Doe"
            value={formData.Dokter}
            onChange={handleChange}
          />
        </div>

        {/* Gender */}
        <div className="form-group">
          <label>Gender</label>
          <select
            name="Gender"
            value={formData.Gender}
            onChange={handleChange}
          >
            <option value="">-- Pilih Gender --</option>
            <option value="Pria">Pria</option>
            <option value="Wanita">Wanita</option>
          </select>
        </div>

        {/* Umur */}
        <div className="form-group">
          <label>Umur</label>
          <input
            name="Umur"
            placeholder="Contoh: 45"
            value={formData.Umur}
            onChange={handleChange}
          />
        </div>

        {/* Diagnosa */}
        <div className="form-group">
          <label>Diagnosa</label>
          <input
            name="Diagnosa"
            placeholder="Contoh: Hernia Inguinalis"
            value={formData.Diagnosa}
            onChange={handleChange}
          />
        </div>

        {/* Payer */}
        <div className="form-group">
          <label>Payer</label>
          <input
            name="Payer"
            placeholder="Contoh: BPJS"
            value={formData.Payer}
            onChange={handleChange}
          />
        </div>

        {/* Kelas */}
        <div className="form-group">
          <label>Kelas</label>
          <input
            name="Kelas"
            placeholder="Contoh: Kelas 1"
            value={formData.Kelas}
            onChange={handleChange}
          />
        </div>

        {/* Skala */}
        <div className="form-group">
          <label>Skala</label>
          <input
            name="Skala"
            placeholder="Contoh: Prioritas"
            value={formData.Skala}
            onChange={handleChange}
          />
        </div>

      </div>

      {/* Action Buttons */}
      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>
          Batal
        </button>

        <button
          type="submit"
          className="btn-submit"
          disabled={loading}
        >
          {loading ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Tambah Pasien"}
        </button>
      </div>

    </form>
  );
};

export default AddPatientForm;
