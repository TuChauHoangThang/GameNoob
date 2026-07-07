const wishlistModel = require('../models/wishlistModel');

/**
 * Lấy danh sách wishlist của người dùng đang đăng nhập.
 * @route GET /api/wishlist
 * @param {object} req - Express request object (userId từ authMiddleware)
 * @param {object} res - Express response object
 */
const getWishlist = async (req, res) => {
  try {
    const userId = req.userId; // Từ authMiddleware
    const wishlist = await wishlistModel.getWishlistByUserId(userId);
    res.json(wishlist);
  } catch (error) {
    console.error('Lỗi lấy wishlist:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

/**
 * Thêm một game vào wishlist của người dùng.
 * Nếu game đã có trong wishlist, trả về lỗi 400.
 * @route POST /api/wishlist
 * @param {object} req - Express request object (body: gameId)
 * @param {object} res - Express response object
 */
const addGameToWishlist = async (req, res) => {
  try {
    const userId = req.userId;
    const { gameId } = req.body;
    if (!gameId) {
      return res.status(400).json({ message: 'Thiếu gameId' });
    }
    const addedItem = await wishlistModel.addToWishlist(userId, gameId);
    if (!addedItem) {
      return res.status(400).json({ message: 'Game đã có trong wishlist hoặc lỗi thêm' });
    }
    res.status(201).json({ message: 'Đã thêm vào wishlist', item: addedItem });
  } catch (error) {
    console.error('Lỗi thêm vào wishlist:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

/**
 * Xóa một game khỏi wishlist của người dùng.
 * Trả về 404 nếu game không tồn tại trong wishlist.
 * @route DELETE /api/wishlist/:gameId
 * @param {object} req - Express request object (params: gameId)
 * @param {object} res - Express response object
 */
const removeGameFromWishlist = async (req, res) => {
  try {
    const userId = req.userId;
    const { gameId } = req.params;
    const removedItem = await wishlistModel.removeFromWishlist(userId, gameId);
    if (!removedItem) {
      return res.status(404).json({ message: 'Không tìm thấy game trong wishlist' });
    }
    res.json({ message: 'Đã xóa khỏi wishlist', item: removedItem });
  } catch (error) {
    console.error('Lỗi xóa khỏi wishlist:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  getWishlist,
  addGameToWishlist,
  removeGameFromWishlist
};
