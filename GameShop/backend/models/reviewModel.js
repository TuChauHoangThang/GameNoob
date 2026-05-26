const pool = require('../configs/db');

// Lấy tất cả review của một game
const getReviewsByGameId = async (gameId) => {
  const result = await pool.query(
    `SELECT r.id, r.rating, r.content, r.created_at,
            u.username, u.id as user_id
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.game_id = $1
     ORDER BY r.created_at DESC`,
    [gameId]
  );
  return result.rows;
};

// Lấy thống kê rating của game (avg, count)
const getRatingStats = async (gameId) => {
  const result = await pool.query(
    `SELECT
       COUNT(*) as total_reviews,
       ROUND(AVG(rating)::numeric, 1) as avg_rating,
       COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive,
       COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative
     FROM reviews WHERE game_id = $1`,
    [gameId]
  );
  return result.rows[0];
};

// Kiểm tra user đã review game này chưa
const getUserReview = async (userId, gameId) => {
  const result = await pool.query(
    'SELECT * FROM reviews WHERE user_id = $1 AND game_id = $2',
    [userId, gameId]
  );
  return result.rows[0];
};

// Tạo review mới
const createReview = async (userId, gameId, rating, content) => {
  const result = await pool.query(
    `INSERT INTO reviews (user_id, game_id, rating, content)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, gameId, rating, content]
  );
  return result.rows[0];
};

// Cập nhật review
const updateReview = async (reviewId, userId, rating, content) => {
  const result = await pool.query(
    `UPDATE reviews SET rating = $1, content = $2, updated_at = NOW()
     WHERE id = $3 AND user_id = $4
     RETURNING *`,
    [rating, content, reviewId, userId]
  );
  return result.rows[0];
};

// Xóa review
const deleteReview = async (reviewId, userId) => {
  const result = await pool.query(
    'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING *',
    [reviewId, userId]
  );
  return result.rows[0];
};

module.exports = {
  getReviewsByGameId,
  getRatingStats,
  getUserReview,
  createReview,
  updateReview,
  deleteReview,
};
