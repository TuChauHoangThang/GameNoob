const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.connect(async (err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err.stack);
  } else {
    console.log('Connected to PostgreSQL successfully!');
    try {
      const createUsersTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      const createGamesTableQuery = `
        CREATE TABLE IF NOT EXISTS games (
          id SERIAL PRIMARY KEY,
          steam_appid INTEGER UNIQUE,
          name VARCHAR(500) NOT NULL,
          short_description TEXT,
          detailed_description TEXT,
          header_image TEXT,
          capsule_image TEXT,
          website TEXT,
          developers TEXT[],
          publishers TEXT[],
          price_overview JSONB,
          price_usd FLOAT,
          price_vnd BIGINT,
          is_free BOOLEAN DEFAULT FALSE,
          platforms JSONB,
          categories JSONB,
          genres JSONB,
          tags JSONB,
          screenshots JSONB,
          movies JSONB,
          release_date TEXT,
          metacritic_score INTEGER,
          background TEXT,
          rating FLOAT DEFAULT 0,
          owners VARCHAR(100),
          positive_ratings INTEGER DEFAULT 0,
          negative_ratings INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await client.query(createUsersTableQuery);
      await client.query(createGamesTableQuery);
      console.log('Bảng "users" và "games" đã được kiểm tra/tạo tự động thành công.');
    } catch (dbErr) {
      console.error('Lỗi khi tự động tạo bảng:', dbErr);
    } finally {
      release(); // Giải phóng connection
    }
  }
});

module.exports = pool;
