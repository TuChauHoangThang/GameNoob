const { Wishlist, Game } = require('../orm');

/**
 * Lấy danh sách wishlist của người dùng, kèm thông tin đầy đủ của từng game.
 * Sắp xếp theo thời điểm thêm vào mới nhất.
 * @param {number} userId - ID người dùng
 * @returns {Array} Danh sách game trong wishlist (kèm wishlist_id, added_at)
 */
const getWishlistByUserId = async (userId) => {
  const items = await Wishlist.findAll({
    where: { user_id: userId },
    include: [{ model: Game }],
    order: [['added_at', 'DESC']],
  });

  return items.map((item) => {
    const plain = item.get({ plain: true });
    return { wishlist_id: plain.id, added_at: plain.added_at, ...plain.Game };
  });
};

/**
 * Thêm một game vào wishlist của người dùng.
 * Sử dụng ON CONFLICT để tránh thêm trùng (mỗi user chỉ có 1 bản ghi mỗi game).
 * @param {number} userId - ID người dùng
 * @param {number} gameId - ID game cần thêm
 * @returns {object|undefined} Bản ghi mới hoặc undefined nếu đã tồn tại
 */
const addToWishlist = async (userId, gameId) => {
  const [record, created] = await Wishlist.findOrCreate({
    where: { user_id: userId, game_id: gameId },
    defaults: { user_id: userId, game_id: gameId },
  });
  return created ? record.get({ plain: true }) : null;
};

/**
 * Xóa một game khỏi wishlist của người dùng.
 * @param {number} userId - ID người dùng
 * @param {number} gameId - ID game cần xóa
 * @returns {object|undefined} Bản ghi đã xóa hoặc undefined nếu không tìm thấy
 */
const removeFromWishlist = async (userId, gameId) => {
  const record = await Wishlist.findOne({ where: { user_id: userId, game_id: gameId } });
  if (!record) return null;
  const plain = record.get({ plain: true });
  await record.destroy();
  return plain;
};

module.exports = { getWishlistByUserId, addToWishlist, removeFromWishlist };
