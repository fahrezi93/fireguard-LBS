import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  try {
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'fireguard',
    });

    const connection = await pool.getConnection();
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('SET @count = 0');
    await connection.query('UPDATE reports SET id = @count:= @count + 1 ORDER BY created_at ASC');
    await connection.query('ALTER TABLE reports AUTO_INCREMENT = 1');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    connection.release();
    await pool.end();

    return NextResponse.json({ success: true, message: "ID Laporan telah diperbaiki (mulai dari 1)!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
