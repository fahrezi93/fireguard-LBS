require('dotenv').config();
const mysql = require('mysql2/promise');

async function migratePetugas() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'fireguard',
  });

  try {
    console.log('🔧 Starting petugas migration...');

    // 1. Update users table
    const [userRows] = await connection.execute('DESCRIBE users');
    const userCols = userRows.map(r => r.Field);

    if (!userCols.includes('role')) {
      await connection.execute(`ALTER TABLE users ADD COLUMN role ENUM('user', 'operator', 'petugas') DEFAULT 'user'`);
      console.log('✅ role added to users');
      
      // Migrate existing is_verified/operator if any
      // Assuming previous operators had specific emails or isOperator flag if there was any in DB?
      // Actually jwt is used for isOperator. Let's not guess.
    }
    if (!userCols.includes('kelurahan_id')) {
      await connection.execute('ALTER TABLE users ADD COLUMN kelurahan_id INT DEFAULT NULL');
      console.log('✅ kelurahan_id added to users');
    }
    if (!userCols.includes('is_on_duty')) {
      await connection.execute('ALTER TABLE users ADD COLUMN is_on_duty TINYINT(1) DEFAULT 0');
      console.log('✅ is_on_duty added to users');
    }

    // 2. Update reports table
    const [reportRows] = await connection.execute('DESCRIBE reports');
    const reportCols = reportRows.map(r => r.Field);

    if (!reportCols.includes('assigned_petugas_id')) {
      await connection.execute('ALTER TABLE reports ADD COLUMN assigned_petugas_id INT DEFAULT NULL');
      console.log('✅ assigned_petugas_id added to reports');
    }
    if (!reportCols.includes('status_petugas')) {
      await connection.execute(`ALTER TABLE reports ADD COLUMN status_petugas ENUM('pending', 'accepted', 'arrived', 'completed', 'false_report', 'escalated_to_damkar') DEFAULT 'pending'`);
      console.log('✅ status_petugas added to reports');
    }
    if (!reportCols.includes('dispatched_at')) {
      await connection.execute('ALTER TABLE reports ADD COLUMN dispatched_at DATETIME DEFAULT NULL');
      console.log('✅ dispatched_at added to reports');
    }
    if (!reportCols.includes('accepted_at')) {
      await connection.execute('ALTER TABLE reports ADD COLUMN accepted_at DATETIME DEFAULT NULL');
      console.log('✅ accepted_at added to reports');
    }
    if (!reportCols.includes('arrived_at')) {
      await connection.execute('ALTER TABLE reports ADD COLUMN arrived_at DATETIME DEFAULT NULL');
      console.log('✅ arrived_at added to reports');
    }
    if (!reportCols.includes('completed_at')) {
      await connection.execute('ALTER TABLE reports ADD COLUMN completed_at DATETIME DEFAULT NULL');
      console.log('✅ completed_at added to reports');
    }
    if (!reportCols.includes('completion_photo_url')) {
      await connection.execute('ALTER TABLE reports ADD COLUMN completion_photo_url VARCHAR(500) DEFAULT NULL');
      console.log('✅ completion_photo_url added to reports');
    }
    if (!reportCols.includes('response_time_seconds')) {
      await connection.execute('ALTER TABLE reports ADD COLUMN response_time_seconds INT DEFAULT NULL');
      console.log('✅ response_time_seconds added to reports');
    }

    console.log('🚀 Petugas Migration successful!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await connection.end();
  }
}

migratePetugas();
