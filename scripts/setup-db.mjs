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

    // Note: DROP TABLE command is removed so it won't overwrite existing data

    console.log('📦 Creating tables...');
    // Create users table with name, email, phone_number
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone_number VARCHAR(20),
        password_hash VARCHAR(255),
        is_verified TINYINT(1) DEFAULT 0,
        role VARCHAR(20) DEFAULT 'user',
        last_latitude DECIMAL(10, 8),
        last_longitude DECIMAL(11, 8),
        last_location_update TIMESTAMP NULL,
        is_on_duty TINYINT(1) DEFAULT 0,
        kelurahan_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ Table users created');

    // Create operators table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS operators (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ Table operators created');

    // Create kelurahan table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS kelurahan (
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
      CREATE TABLE IF NOT EXISTS disaster_categories (
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
      CREATE TABLE IF NOT EXISTS reports (
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
        guest_name VARCHAR(100),
        category_id INT DEFAULT 1,
        kelurahan_id INT,
        assigned_petugas_id INT,
        status_petugas VARCHAR(30),
        accepted_at TIMESTAMP NULL,
        dispatched_at TIMESTAMP NULL,
        arrived_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        needs_backup TINYINT(1) DEFAULT 0,
        petugas_notes TEXT,
        completion_photo_url VARCHAR(500),
        response_time_seconds INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (category_id) REFERENCES disaster_categories(id) ON DELETE SET NULL,
        FOREIGN KEY (kelurahan_id) REFERENCES kelurahan(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_petugas_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ Table reports created');

    // Create otp_attempts table (for email OTP)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS otp_attempts (
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

    // Create articles table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        content LONGTEXT NOT NULL,
        category_id INT,
        author_id INT,
        cover_image VARCHAR(255),
        status ENUM('draft', 'published') DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES disaster_categories(id) ON DELETE SET NULL,
        FOREIGN KEY (author_id) REFERENCES operators(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Table articles created');

    // Create notifications table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
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

    // Create device_tokens table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        user_id       INT NOT NULL,
        device_token  VARCHAR(500) NOT NULL,
        platform      ENUM('android','ios') NOT NULL DEFAULT 'android',
        is_active     BOOLEAN NOT NULL DEFAULT TRUE,
        created_at    DATETIME NOT NULL,
        updated_at    DATETIME NOT NULL,
        last_used_at  DATETIME NOT NULL,
        UNIQUE  KEY uq_device_token (device_token),
        INDEX   idx_dt_user_id   (user_id),
        INDEX   idx_dt_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ Table device_tokens created');

    // Create notification_preferences table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        user_id      INT NOT NULL UNIQUE,
        approved     BOOLEAN NOT NULL DEFAULT TRUE,
        in_progress  BOOLEAN NOT NULL DEFAULT TRUE,
        completed    BOOLEAN NOT NULL DEFAULT TRUE,
        verified     BOOLEAN NOT NULL DEFAULT TRUE,
        false_report BOOLEAN NOT NULL DEFAULT TRUE,
        created_at   DATETIME NOT NULL,
        updated_at   DATETIME NOT NULL,
        INDEX idx_np_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ Table notification_preferences created');

    // Create notification_logs table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        report_id       INT NOT NULL,
        user_id         INT NOT NULL,
        device_token    VARCHAR(500) NOT NULL,
        status_change   VARCHAR(50)  NOT NULL,
        title           VARCHAR(255) NOT NULL,
        body            TEXT         NOT NULL,
        delivery_status ENUM('sent','failed','retry') NOT NULL,
        error_message   TEXT         NULL,
        retry_count     INT          NOT NULL DEFAULT 0,
        sent_at         DATETIME     NOT NULL,
        INDEX idx_nl_report_id (report_id),
        INDEX idx_nl_user_id   (user_id),
        INDEX idx_nl_sent_at   (sent_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ Table notification_logs created');

    // Create broadcast_logs table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS broadcast_logs (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        operator_id   INT NOT NULL,
        title         VARCHAR(255) NOT NULL,
        message       TEXT NOT NULL,
        total_tokens  INT NOT NULL DEFAULT 0,
        success_count INT NOT NULL DEFAULT 0,
        failure_count INT NOT NULL DEFAULT 0,
        sent_at       DATETIME NOT NULL,
        INDEX idx_bl_operator_id (operator_id),
        INDEX idx_bl_sent_at (sent_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ Table broadcast_logs created');

    // Create fire_stations table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS fire_stations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        address TEXT,
        latitude DECIMAL(10,8) NOT NULL,
        longitude DECIMAL(11,8) NOT NULL,
        contact_phone VARCHAR(50),
        status VARCHAR(20) DEFAULT 'aktif',
        kelurahan_id INT,
        equipment_details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (kelurahan_id) REFERENCES kelurahan(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ Table fire_stations created');

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
        'INSERT IGNORE INTO kelurahan (name, kode_pos, kecamatan, kota, description) VALUES (?, ?, ?, ?, ?)', 
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
      await db.execute('INSERT IGNORE INTO disaster_categories (name, icon, color, description) VALUES (?, ?, ?, ?)', [cat.name, cat.icon, cat.color, cat.description]);
      console.log(`  ✓ Added category: ${cat.icon} ${cat.name}`);
    }

    // Create default operator
    console.log('\n👤 Creating default operator...');
    const hashedPassword = await bcrypt.hash('operator123', SALT_ROUNDS);
    await db.execute('INSERT IGNORE INTO operators (username, password_hash) VALUES (?, ?)', ['operator', hashedPassword]);
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
