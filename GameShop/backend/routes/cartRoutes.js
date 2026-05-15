const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = cartController;

// Tất cả route đều yêu cầu đăng nhập
router.get('/', authenticate, cartController.getCart);
router.post('/add', authenticate, cartController.addToCart);
router.put('/:id', authenticate, cartController.updateQuantity);
router.delete('/:id', authenticate, cartController.removeFromCart);
router.delete('/', authenticate, cartController.clearCart);

module.exports = router;
