/**
 * Script tạo bảng reviews trong database.
 * Chạy: node create_reviews_table.js
 */
require('dotenv').config();
const pool = require('./configs/db');

const createTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        game_id     INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        rating      SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        content     TEXT NOT NULL,
        created_at  TIMESTAMP DEFAULT NOW(),
        updated_at  TIMESTAMP DEFAULT NOW(),
        UNIQUE (user_id, game_id)
      );
    `);
    console.log(' Bảng reviews đã được tạo thành công!');
    console.log('   - user_id: FK → users.id');
    console.log('   - game_id: FK → games.id');
    console.log('   - rating: 1-5 (CHECK constraint)');
    console.log('   - UNIQUE(user_id, game_id): mỗi user chỉ review 1 lần/game');
    process.exit(0);
  } catch (error) {
    console.error(' Lỗi tạo bảng:', error.message);
    process.exit(1);
  }
};

createTable();
