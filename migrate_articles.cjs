const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' }); // trying .env.local first
require('dotenv').config({ path: '.env' });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'siagabencana',
  });

  console.log('Connected to DB');

  try {
    await connection.execute(`
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
    console.log('Table articles created successfully.');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    await connection.end();
  }
}

run();
