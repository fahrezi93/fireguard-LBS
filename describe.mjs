import mysql from 'mysql2/promise';

async function main() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'fireguard',
  });
  try {
    const [rows] = await pool.query('DESCRIBE reports');
    console.log(JSON.stringify(rows, null, 2));
    const [kelurahan] = await pool.query('SELECT * FROM kelurahan WHERE name LIKE "%Plaju%"');
    console.log("Kelurahan:", JSON.stringify(kelurahan, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
main();
