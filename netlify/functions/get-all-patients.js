const { db } = require('../utils/database');
const { verifyAdminToken } = require('../utils/auth');
const { checkPermission } = require('../utils/permissions');

exports.handler = async function (event, context) {
  console.log('=== get-all-patients called ===');
  
  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Cek authorization
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  try {
    const decoded = verifyAdminToken(authHeader);
    if (!decoded) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Check permission untuk view_patients
    if (!checkPermission(decoded, 'view_patients')) {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Insufficient permissions' })
      };
    }

    const { page = 1, limit = 20 } = event.queryStringParameters;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    console.log(`Fetching patients - Page: ${pageNum}, Limit: ${limitNum}, Offset: ${offset}`);

    // Query untuk mendapatkan data pasien dengan SEMUA kolom
    const result = await db.query(
      `SELECT 
        "NomorMR", 
        "NamaPasien", 
        "JadwalOperasi", 
        COALESCE("Dokter", 'Akan ditentukan') as "Dokter", 
        "StatusPersetujuan", 
        "TimestampPersetujuan", 
        "TokenAkses", 
        COALESCE("Gender", '-') as "Gender", 
        COALESCE("Umur", '-') as "Umur", 
        COALESCE("Diagnosa", '-') as "Diagnosa", 
        COALESCE("Payer", '-') as "Payer", 
        COALESCE("Kelas", '-') as "Kelas", 
        COALESCE("Skala", '-') as "Skala"
       FROM patients 
       ORDER BY 
         CASE WHEN "JadwalOperasi" IS NULL THEN 1 ELSE 0 END,
         "JadwalOperasi" DESC,
         "TimestampDibuat" DESC 
       LIMIT $1 OFFSET $2`,
      [limitNum, offset]
    );

    console.log(`Query successful, found ${result.rows.length} patients`);

    // Query untuk total count
    const countResult = await db.query('SELECT COUNT(*) as total_count FROM patients');
    const total = parseInt(countResult.rows[0].total_count);

    console.log(`Total patients: ${total}, Total pages: ${Math.ceil(total / limitNum)}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        patients: result.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }),
    };
  } catch (error) {
    console.error('Error fetching patients:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      body: JSON.stringify({ 
        error: 'Gagal mengambil data pasien',
        details: error.message,
        suggestion: 'Pastikan database sudah terhubung dan tabel patients sudah dibuat'
      }),
    };
  }
};