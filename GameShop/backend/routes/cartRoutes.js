const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

// Tất cả route đều yêu cầu đăng nhập
router.get('/', authMiddleware, cartController.getCart);
router.post('/add', authMiddleware, cartController.addToCart);
router.put('/:id', authMiddleware, cartController.updateQuantity);
router.delete('/:id', authMiddleware, cartController.removeFromCart);
router.delete('/', authMiddleware, cartController.clearCart);

module.exports = router;
