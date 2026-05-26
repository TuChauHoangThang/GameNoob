const cartModel = require('../models/cartModel');
const jwt = require('jsonwebtoken');

// Middleware xác thực token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện chức năng này.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey_gamenoob');
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

// Lấy giỏ hàng
const getCart = async (req, res) => {
  try {
    const items = await cartModel.getCartByUserId(req.user.id);
    const count = await cartModel.getCartCount(req.user.id);
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
    const item = await cartModel.addToCart(req.user.id, gameId);
    if (item && item.alreadyInCart) {
      return res.status(409).json({ success: false, message: 'Game này đã có trong giỏ hàng.' });
    }
    const count = await cartModel.getCartCount(req.user.id);
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
    const item = await cartModel.updateCartQuantity(id, req.user.id, quantity);
    const count = await cartModel.getCartCount(req.user.id);
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
    await cartModel.removeFromCart(id, req.user.id);
    const count = await cartModel.getCartCount(req.user.id);
    res.json({ success: true, count, message: 'Đã xóa khỏi giỏ hàng.' });
  } catch (error) {
    console.error('Lỗi xóa giỏ hàng:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

// Xóa toàn bộ giỏ hàng
const clearCart = async (req, res) => {
  try {
    await cartModel.clearCart(req.user.id);
    res.json({ success: true, message: 'Đã xóa toàn bộ giỏ hàng.' });
  } catch (error) {
    console.error('Lỗi xóa giỏ hàng:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

module.exports = {
  authenticate,
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
};
