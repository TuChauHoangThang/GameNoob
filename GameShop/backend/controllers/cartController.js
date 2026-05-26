const cartModel = require('../models/cartModel');
// Lưu ý: xác thực được xử lý bởi authMiddleware, không cần import jwt ở đây

// Lấy giỏ hàng
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

// Thêm vào giỏ hàng
const addToCart = async (req, res) => {
  try {
    const { gameId } = req.body;
    if (!gameId) {
      return res.status(400).json({ message: 'Thiếu gameId.' });
    }
    const item = await cartModel.addToCart(req.userId, gameId);
    const count = await cartModel.getCartCount(req.userId);
    res.json({ success: true, data: item, count, message: 'Đã thêm vào giỏ hàng!' });
  } catch (error) {
    console.error('Lỗi thêm giỏ hàng:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

// Cập nhật số lượng
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

// Xóa khỏi giỏ hàng
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

// Xóa toàn bộ giỏ hàng
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
