const pool = require('./database');
const authorize = require('./authorize');

exports.handler = async (event) => {
  try {
    const authResult = authorize(event);
    if (!authResult.success) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: authResult.error })
      };
    }

    const result = await pool.query(
      `SELECT patient_base_url, updated_at, updated_by 
       FROM app_settings
       ORDER BY updated_at DESC
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          patientBaseUrl: "",
          updated_at: null,
          updated_by: null
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        patientBaseUrl: result.rows[0].patient_base_url,
        updated_at: result.rows[0].updated_at,
        updated_by: result.rows[0].updated_by
      })
    };

  } catch (err) {
    console.error("settings-get error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};
