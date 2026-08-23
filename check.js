const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'siagabencana',
    port: process.env.MYSQL_PORT || 3306,
  });

  const [petugas] = await connection.execute("SELECT id, name FROM users WHERE role = 'petugas'");
  console.log("Petugas:", petugas);

  const [reports] = await connection.execute("SELECT status, assigned_petugas_id, COUNT(*) as count FROM reports GROUP BY status, assigned_petugas_id");
  console.log("Reports:", reports);

  await connection.end();
}
check();
