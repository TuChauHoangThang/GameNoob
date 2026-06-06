const pool = require('../configs/db');

/**
 * Lấy danh sách wishlist của người dùng, kèm thông tin đầy đủ của từng game.
 * Sắp xếp theo thời điểm thêm vào mới nhất.
 * @param {number} userId - ID người dùng
 * @returns {Array} Danh sách game trong wishlist (kèm wishlist_id, added_at)
 */
const getWishlistByUserId = async (userId) => {
  const query = `
    SELECT w.id as wishlist_id, w.added_at, g.* 
    FROM wishlists w
    JOIN games g ON w.game_id = g.id
    WHERE w.user_id = $1
    ORDER BY w.added_at DESC
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

/**
 * Thêm một game vào wishlist của người dùng.
 * Sử dụng ON CONFLICT để tránh thêm trùng (mỗi user chỉ có 1 bản ghi mỗi game).
 * @param {number} userId - ID người dùng
 * @param {number} gameId - ID game cần thêm
 * @returns {object|undefined} Bản ghi mới hoặc undefined nếu đã tồn tại
 */
const addToWishlist = async (userId, gameId) => {
  const query = `
    INSERT INTO wishlists (user_id, game_id) 
    VALUES ($1, $2) 
    ON CONFLICT (user_id, game_id) DO NOTHING
    RETURNING *;
  `;
  const result = await pool.query(query, [userId, gameId]);
  return result.rows[0];
};

/**
 * Xóa một game khỏi wishlist của người dùng.
 * @param {number} userId - ID người dùng
 * @param {number} gameId - ID game cần xóa
 * @returns {object|undefined} Bản ghi đã xóa hoặc undefined nếu không tìm thấy
 */
const removeFromWishlist = async (userId, gameId) => {
  const query = `
    DELETE FROM wishlists 
    WHERE user_id = $1 AND game_id = $2
    RETURNING *;
  `;
  const result = await pool.query(query, [userId, gameId]);
  return result.rows[0];
};

module.exports = {
  getWishlistByUserId,
  addToWishlist,
  removeFromWishlist
};

