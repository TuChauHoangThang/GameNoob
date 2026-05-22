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
        CREATE TABLE IF NOT EXISTS wishlists (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
          added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, game_id)
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
      
      const createCartsTableQuery = `
        CREATE TABLE IF NOT EXISTS carts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
          quantity INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, game_id)
        );
      `;
      await client.query(createCartsTableQuery);

      // Bảng đơn hàng
      const createOrdersTableQuery = `
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          total_amount BIGINT NOT NULL DEFAULT 0,
          payment_method VARCHAR(50),
          card_last_four VARCHAR(4),
          status VARCHAR(20) DEFAULT 'completed',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await client.query(createOrdersTableQuery);

      // Bảng chi tiết đơn hàng
      const createOrderItemsTableQuery = `
        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
          price_at_purchase BIGINT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await client.query(createOrderItemsTableQuery);

      // Bảng thư viện game người dùng
      const createUserLibraryTableQuery = `
        CREATE TABLE IF NOT EXISTS user_library (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
          order_id INTEGER REFERENCES orders(id),
          acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, game_id)
        );
      `;
      await client.query(createUserLibraryTableQuery);

      // Bảng thẻ thanh toán đã lưu
      const createPaymentCardsTableQuery = `
        CREATE TABLE IF NOT EXISTS payment_cards (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          card_type VARCHAR(30),
          last_four VARCHAR(4) NOT NULL,
          holder_name VARCHAR(100),
          expiry_month INTEGER,
          expiry_year INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, last_four)
        );
      `;
      await client.query(createPaymentCardsTableQuery);

      // Tự động kiểm tra/thêm các cột cho chức năng thư viện người dùng
      await client.query(`
        ALTER TABLE user_library ADD COLUMN IF NOT EXISTS play_time FLOAT DEFAULT 0;
        ALTER TABLE user_library ADD COLUMN IF NOT EXISTS last_played TIMESTAMP;
        ALTER TABLE user_library ADD COLUMN IF NOT EXISTS install_status VARCHAR(20) DEFAULT 'not_installed';
        ALTER TABLE user_library ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
      `);
      console.log('Các cột tính năng Thư viện (play_time, last_played, install_status, is_favorite) đã được kiểm tra/di chuyển thành công.');

      console.log('Tất cả bảng (users, games, carts, orders, order_items, user_library, payment_cards) đã được kiểm tra/tạo tự động thành công.');
    } catch (dbErr) {
      console.error('Lỗi khi tự động tạo bảng:', dbErr);
    } finally {
      release(); // Giải phóng connection
    }
  }
});

module.exports = pool;
