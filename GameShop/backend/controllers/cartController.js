const cartModel = require('../models/cartModel');

/**
 * Lấy danh sách sản phẩm và tổng số lượng mặt hàng trong giỏ hàng của người dùng hiện tại.
 * @route GET /api/cart
 * @param {object} req - Express request object (userId được gán từ authMiddleware)
 * @param {object} res - Express response object
 */
const getCart = async (req, res) => {
  try {
    const items = await cartModel.getCartByUserId(req.userId);
    const count = await cartModel.getCartCount(req.userId);
    res.json({ success: true, data: items, count });
  } catch (error) {
    console.error('Lỗi lấy giỏ hàng:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

/**
 * Thêm sản phẩm game mới vào giỏ hàng cá nhân (Kiểm tra nếu game đã có sẵn để tránh trùng lặp).
 * @route POST /api/cart/add
 * @param {object} req - Express request object (body: gameId)
 * @param {object} res - Express response object
 */
const addToCart = async (req, res) => {
  try {
    const { gameId } = req.body;
    if (!gameId) {
      return res.status(400).json({ message: 'Thiếu gameId.' });
    }

    const item = await cartModel.addToCart(req.userId, gameId);

    if (item && item.alreadyInCart) {
      return res.status(409).json({ success: false, message: 'Game này đã có trong giỏ hàng.' });
    }

    const count = await cartModel.getCartCount(req.userId);
    res.json({ success: true, data: item, count, message: 'Đã thêm vào giỏ hàng!' });
  } catch (error) {
    console.error('Lỗi thêm giỏ hàng:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

/**
 * Cập nhật số lượng của một sản phẩm game cụ thể trong giỏ hàng.
 * @route PUT /api/cart/:id
 * @param {object} req - Express request object (params: id, body: quantity)
 * @param {object} res - Express response object
 */
const updateQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const item = await cartModel.updateCartQuantity(id, req.userId, quantity);
    const count = await cartModel.getCartCount(req.userId);
    res.json({ success: true, data: item, count });
  } catch (error) {
    console.error('Lỗi cập nhật giỏ hàng:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

/**
 * Xóa một sản phẩm game khỏi giỏ hàng cá nhân dựa vào ID mặt hàng trong giỏ.
 * @route DELETE /api/cart/:id
 * @param {object} req - Express request object (params: id)
 * @param {object} res - Express response object
 */
const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;
    await cartModel.removeFromCart(id, req.userId);
    const count = await cartModel.getCartCount(req.userId);
    res.json({ success: true, count, message: 'Đã xóa khỏi giỏ hàng.' });
  } catch (error) {
    console.error('Lỗi xóa giỏ hàng:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

/**
 * Xóa toàn bộ sản phẩm và dọn sạch giỏ hàng của người dùng hiện tại.
 * @route DELETE /api/cart
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const clearCart = async (req, res) => {
  try {
    await cartModel.clearCart(req.userId);
    res.json({ success: true, message: 'Đã xóa toàn bộ giỏ hàng.' });
  } catch (error) {
    console.error('Lỗi xóa giỏ hàng:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
};