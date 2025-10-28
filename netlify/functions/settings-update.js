const pool = require('./database');
const authorize = require('./authorize');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const authResult = authorize(event);
    if (!authResult.success) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: authResult.error })
      };
    }

    const user = authResult.user;
    const { patientBaseUrl } = JSON.parse(event.body);

    if (!patientBaseUrl || patientBaseUrl.length < 8) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "URL tidak valid" })
      };
    }

    // Save as history first ✅
    await pool.query(
      `INSERT INTO settings_history (patient_base_url, updated_by)
       VALUES ($1, $2)`,
      [patientBaseUrl, user.username]
    );

    // Update active config ✅
    await pool.query(`
      INSERT INTO app_settings (patient_base_url, updated_by)
      VALUES ($1, $2)
    `, [patientBaseUrl, user.username]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Pengaturan berhasil diperbarui!",
        updated_by: user.username
      })
    };

  } catch (err) {
    console.error("settings-update error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Gagal menyimpan pengaturan" })
    };
  }
};
