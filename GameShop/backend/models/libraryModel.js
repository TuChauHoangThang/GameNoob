const pool = require('../configs/db');

// Thêm game vào thư viện người dùng
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

// Lấy thư viện game của user
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

// Kiểm tra xem user đã sở hữu game chưa
const isGameOwned = async (userId, gameId) => {
  const result = await pool.query(
    'SELECT id FROM user_library WHERE user_id = $1 AND game_id = $2',
    [userId, gameId]
  );
  return result.rows.length > 0;
};

// Kiểm tra nhiều game cùng lúc
const getOwnedGameIds = async (userId, gameIds) => {
  if (!gameIds || gameIds.length === 0) return [];
  const result = await pool.query(
    'SELECT game_id FROM user_library WHERE user_id = $1 AND game_id = ANY($2)',
    [userId, gameIds]
  );
  return result.rows.map(r => r.game_id);
};

// Cập nhật trạng thái cài đặt game
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

// Cập nhật trạng thái yêu thích game
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
