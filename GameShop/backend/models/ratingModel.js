const pool = require('../configs/db');

// Tạo bảng user_ratings nếu chưa tồn tại
const initRatingsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_ratings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      is_positive BOOLEAN NOT NULL,
      stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, game_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `);
};

// Kiểm tra user đã rating game chưa
const getUserRating = async (userId, gameId) => {
  const result = await pool.query(
    `SELECT ur.*, u.username
     FROM user_ratings ur
     JOIN users u ON ur.user_id = u.id
     WHERE ur.user_id = $1 AND ur.game_id = $2`,
    [userId, gameId]
  );
  return result.rows[0] || null;
};

// Lấy tất cả rating của một game (kèm username)
const getRatingsByGameId = async (gameId) => {
  const result = await pool.query(
    `SELECT ur.id, ur.user_id, ur.is_positive, ur.stars, ur.comment, ur.created_at,
            u.username
     FROM user_ratings ur
     JOIN users u ON ur.user_id = u.id
     WHERE ur.game_id = $1
     ORDER BY ur.created_at DESC`,
    [gameId]
  );
  return result.rows;
};

// Lấy thống kê rating của game
const getRatingStats = async (gameId) => {
  const result = await pool.query(
    `SELECT
       COUNT(*) AS total_ratings,
       SUM(CASE WHEN is_positive THEN 1 ELSE 0 END) AS positive_count,
       SUM(CASE WHEN NOT is_positive THEN 1 ELSE 0 END) AS negative_count,
       ROUND(AVG(stars)::numeric, 1) AS avg_stars
     FROM user_ratings
     WHERE game_id = $1`,
    [gameId]
  );
  return result.rows[0];
};

// Thêm rating mới
const createRating = async (userId, gameId, isPositive, stars, comment) => {
  const result = await pool.query(
    `INSERT INTO user_ratings (user_id, game_id, is_positive, stars, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, gameId, isPositive, stars, comment || null]
  );
  return result.rows[0];
};

module.exports = {
  initRatingsTable,
  getUserRating,
  getRatingsByGameId,
  getRatingStats,
  createRating,
};
