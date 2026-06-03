import mysql from 'mysql2/promise';
import 'dotenv/config';

async function setupDisasterCategories() {
  const db = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'fireguard',
  });

  try {
    console.log('🔧 Setting up disaster categories.');

    // 1. Create disaster_categories table if not exists
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
    console.log('✅ Table disaster_categories ready');

    // 2. Check if categories already exist
    const [countResult] = await db.execute('SELECT COUNT(*) as count FROM disaster_categories');
    const count = countResult[0].count;

    if (count === 0) {
      // 3. Insert default categories
      const defaultCategories = [
        { name: 'Kebakaran', icon: '🔥', color: '#EF4444', description: 'Kejadian kebakaran rumah, gedung, atau lahan' },
        { name: 'Banjir', icon: '🌊', color: '#3B82F6', description: 'Bencana banjir dan genangan air' },
        { name: 'Gempa Bumi', icon: '🏚️', color: '#78350F', description: 'Gempa bumi dan dampaknya' },
        { name: 'Tanah Longsor', icon: '⛰️', color: '#92400E', description: 'Longsor dan pergerakan tanah' },
        { name: 'Angin Puting Beliung', icon: '🌪️', color: '#6B7280', description: 'Angin kencang dan puting beliung' },
      ];

      for (const category of defaultCategories) {
        await db.execute(
          'INSERT INTO disaster_categories (name, icon, color, description) VALUES (?, ?, ?, ?)',
          [category.name, category.icon, category.color, category.description]
        );
        console.log(`  ✓ Added category: ${category.icon} ${category.name}`);
      }
    } else {
      console.log('ℹ️  Categories already exist, skipping insert');
    }

    // 4. Verify setup
    const [categories] = await db.execute('SELECT * FROM disaster_categories WHERE is_active = 1');
    console.log('\n📋 Available disaster categories:');
    categories.forEach(cat => {
      console.log(`  ${cat.icon} ${cat.name} (ID: ${cat.id})`);
    });

    console.log('\n✅ Disaster categories setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up disaster categories:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

setupDisasterCategories();
