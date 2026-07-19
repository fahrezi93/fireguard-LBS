import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const SALT_ROUNDS = 10;

async function setup() {
  console.log('🔧 Setting up MySQL database...');
  
  const connectionWithoutDb = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
  });

  const dbName = process.env.MYSQL_DATABASE || 'fireguard';

  try {
    await connectionWithoutDb.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' ready`);
    await connectionWithoutDb.end();

    const db = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: dbName,
    });

    console.log('📦 Creating tables...');
    await db.execute('SET FOREIGN_KEY_CHECKS = 0');
    await db.execute('DROP TABLE IF EXISTS notifications');
    await db.execute('DROP TABLE IF EXISTS articles');
    await db.execute('DROP TABLE IF EXISTS otp_attempts');
    await db.execute('DROP TABLE IF EXISTS reports');
    await db.execute('DROP TABLE IF EXISTS disaster_categories');
    await db.execute('DROP TABLE IF EXISTS kelurahan');
    await db.execute('DROP TABLE IF EXISTS operators');
    await db.execute('DROP TABLE IF EXISTS users');
    await db.execute('SET FOREIGN_KEY_CHECKS = 1');

    // Create users table with name, email, phone_number
    await db.execute(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone_number VARCHAR(20),
        password_hash VARCHAR(255),
        is_verified TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ Table users created (with name, email, phone_number, password_hash)');

    // Create operators table
    await db.execute(`
      CREATE TABLE operators (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ Table operators created');

    // Create kelurahan table
    await db.execute(`
      CREATE TABLE kelurahan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        kode_pos VARCHAR(10) NOT NULL,
        kecamatan VARCHAR(100) NOT NULL DEFAULT 'Plaju',
        kota VARCHAR(100) NOT NULL DEFAULT 'Plaju, Palembang',
        description TEXT,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ Table kelurahan created');

    // Create disaster_categories table
    await db.execute(`
      CREATE TABLE disaster_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        icon VARCHAR(10) NOT NULL,
        color VARCHAR(20) NOT NULL,
        description TEXT,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ Table disaster_categories created');

    // Create reports table
    await db.execute(`
      CREATE TABLE reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        fire_latitude DECIMAL(10, 8) NOT NULL,
        fire_longitude DECIMAL(11, 8) NOT NULL,
        reporter_latitude DECIMAL(10, 8),
        reporter_longitude DECIMAL(11, 8),
        description TEXT,
        address TEXT,
        media_url VARCHAR(500),
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        admin_notes TEXT,
        notes TEXT,
        contact VARCHAR(50),
        category_id INT DEFAULT 1,
        kelurahan_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (category_id) REFERENCES disaster_categories(id) ON DELETE SET NULL,
        FOREIGN KEY (kelurahan_id) REFERENCES kelurahan(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ Table reports created');

    // Create otp_attempts table (for email OTP)
    await db.execute(`
      CREATE TABLE otp_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        type ENUM('register', 'login') NOT NULL DEFAULT 'login',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ Table otp_attempts created');

    // Create notifications table
    await db.execute(`
      CREATE TABLE notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        report_id INT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_is_read (is_read),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ Table notifications created');

    // Insert kelurahan
    console.log('\n📍 Inserting kelurahan Plaju...');
    const kelurahanPlaju = [
      { 
        name: 'Plaju Ulu', 
        kode_pos: '30266', 
        description: 'Bagian "hulu" (atas) kecamatan, biasanya mencakup area pasar dan pemukiman padat di jalan utama.' 
      },
      { 
        name: 'Plaju Darat', 
        kode_pos: '30267', 
        description: 'Lebih ke arah dalam/darat, menjauh dari sungai Musi.' 
      },
      { 
        name: 'Plaju Ilir', 
        kode_pos: '30268', 
        description: 'Bagian "hilir" (bawah), dekat dengan area kilang pertamina.' 
      },
      { 
        name: 'Bagus Kuning', 
        kode_pos: '30268', 
        description: 'Area bersejarah (Makam Bagus Kuning), dekat tepian Sungai Musi.' 
      },
      { 
        name: 'Komperta', 
        kode_pos: '30268', 
        description: 'Singkatan dari "Komplek Pertamina". Ini adalah area khusus perumahan dan fasilitas Pertamina.' 
      },
      { 
        name: 'Talang Bubuk', 
        kode_pos: '30268', 
        description: 'Area pemukiman yang cukup luas di bagian dalam Plaju.' 
      },
      { 
        name: 'Talang Putri', 
        kode_pos: '30268', 
        description: 'Berbatasan dengan wilayah Banyuasin di sisi timur.' 
      }
    ];
    for (const kel of kelurahanPlaju) {
      await db.execute(
        'INSERT INTO kelurahan (name, kode_pos, kecamatan, kota, description) VALUES (?, ?, ?, ?, ?)', 
        [kel.name, kel.kode_pos, 'Plaju', 'Plaju, Palembang', kel.description]
      );
      console.log(`  ✓ Added kelurahan: ${kel.name} (${kel.kode_pos})`);
    }

    // Insert disaster categories
    console.log('\n📋 Inserting disaster categories...');
    const categories = [
      { name: 'Kebakaran lingkungan & lahan kecil', icon: '🔥', color: '#EF4444', description: 'Kebakaran di lingkungan perumahan atau lahan kecil' },
      { name: 'Banjir & genangan wilayah rawa', icon: '🌊', color: '#3B82F6', description: 'Banjir dan genangan air di wilayah rawa' },
      { name: 'Angin kencang & cuaca ekstrem', icon: '🌪️', color: '#6B7280', description: 'Angin kencang, hujan lebat, dan cuaca ekstrem lainnya' },
      { name: 'Kerusakan infrastruktur lingkungan', icon: '🏚️', color: '#78350F', description: 'Kerusakan jalan, jembatan, dan infrastruktur lingkungan' },
      { name: 'Pencemaran & sampah berisiko', icon: '☣️', color: '#10B981', description: 'Pencemaran lingkungan dan penumpukan sampah berbahaya' },
    ];
    for (const cat of categories) {
      await db.execute('INSERT INTO disaster_categories (name, icon, color, description) VALUES (?, ?, ?, ?)', [cat.name, cat.icon, cat.color, cat.description]);
      console.log(`  ✓ Added category: ${cat.icon} ${cat.name}`);
    }

    // Create default operator
    console.log('\n👤 Creating default operator...');
    const hashedPassword = await bcrypt.hash('operator123', SALT_ROUNDS);
    await db.execute('INSERT INTO operators (username, password_hash) VALUES (?, ?)', ['operator', hashedPassword]);
    console.log('  ✓ Default operator created');
    console.log('    Username: operator');
    console.log('    Password: operator123');

    await db.end();
    console.log('\n✅ Database setup complete!');

  } catch (error) {
    console.error('❌ Failed to setup database:', error);
    process.exit(1);
  }
}

setup();
