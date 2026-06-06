const pool = require('../configs/db');

/**
 * Thêm một game vào thư viện của người dùng sau khi mua hàng.
 * Sử dụng ON CONFLICT để tránh thêm trùng nếu game đã tồn tại.
 * @param {number} userId - ID người dùng
 * @param {number} gameId - ID game
 * @param {number} orderId - ID đơn hàng liên quan
 * @returns {object|undefined} Bản ghi thư viện mới hoặc undefined nếu đã tồn tại
 */
const addToLibrary = async (userId, gameId, orderId) => {
  const result = await pool.query(
    `INSERT INTO user_library (user_id, game_id, order_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, game_id) DO NOTHING
     RETURNING *`,
    [userId, gameId, orderId]
  );
  return result.rows[0];
};

/**
 * Lấy toàn bộ thư viện game của người dùng, kèm thông tin chi tiết từng game.
 * Sắp xếp theo thời điểm mua mới nhất.
 * @param {number} userId - ID người dùng
 * @returns {Array} Danh sách game trong thư viện
 */
const getLibraryByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT ul.id, ul.acquired_at, ul.order_id,
            ul.play_time, ul.last_played, ul.install_status, ul.is_favorite,
            g.id as game_id, g.name, g.header_image, g.short_description,
            g.genres, g.developers, g.release_date, g.price_vnd, g.is_free
     FROM user_library ul
     JOIN games g ON ul.game_id = g.id
     WHERE ul.user_id = $1
     ORDER BY ul.acquired_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Kiểm tra xem người dùng đã sở hữu một game cụ thể hay chưa.
 * @param {number} userId - ID người dùng
 * @param {number} gameId - ID game cần kiểm tra
 * @returns {boolean} true nếu đã sở hữu, false nếu chưa
 */
const isGameOwned = async (userId, gameId) => {
  const result = await pool.query(
    'SELECT id FROM user_library WHERE user_id = $1 AND game_id = $2',
    [userId, gameId]
  );
  return result.rows.length > 0;
};

/**
 * Kiểm tra nhiều game cùng lúc xem người dùng đã sở hữu game nào trong danh sách.
 * Dùng để hiển thị nút "Đã sở hữu" trên trang Store.
 * @param {number} userId - ID người dùng
 * @param {number[]} gameIds - Mảng các ID game cần kiểm tra
 * @returns {number[]} Mảng các game_id mà người dùng đã sở hữu
 */
const getOwnedGameIds = async (userId, gameIds) => {
  if (!gameIds || gameIds.length === 0) return [];
  const result = await pool.query(
    'SELECT game_id FROM user_library WHERE user_id = $1 AND game_id = ANY($2)',
    [userId, gameIds]
  );
  return result.rows.map(r => r.game_id);
};

/**
 * Cập nhật trạng thái cài đặt của game trong thư viện người dùng.
 * Các trạng thái hợp lệ: 'not_installed', 'installing', 'installed'.
 * @param {number} userId - ID người dùng
 * @param {number} gameId - ID game
 * @param {string} installStatus - Trạng thái cài đặt mới
 * @returns {object} Bản ghi thư viện sau khi cập nhật
 */
const updateInstallStatus = async (userId, gameId, installStatus) => {
  const result = await pool.query(
    `UPDATE user_library
     SET install_status = $3
     WHERE user_id = $1 AND game_id = $2
     RETURNING *`,
    [userId, gameId, installStatus]
  );
  return result.rows[0];
};

/**
 * Cập nhật trạng thái yêu thích (favorite) của game trong thư viện.
 * Game yêu thích sẽ được hiển thị ở đầu danh sách thư viện.
 * @param {number} userId - ID người dùng
 * @param {number} gameId - ID game
 * @param {boolean} isFavorite - true để yêu thích, false để bỏ yêu thích
 * @returns {object} Bản ghi thư viện sau khi cập nhật
 */
const updateFavoriteStatus = async (userId, gameId, isFavorite) => {
  const result = await pool.query(
    `UPDATE user_library
     SET is_favorite = $3
     WHERE user_id = $1 AND game_id = $2
     RETURNING *`,
    [userId, gameId, isFavorite]
  );
  return result.rows[0];
};

module.exports = {
  addToLibrary,
  getLibraryByUserId,
  isGameOwned,
  getOwnedGameIds,
  updateInstallStatus,
  updateFavoriteStatus,
};
