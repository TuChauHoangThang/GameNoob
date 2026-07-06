const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { addToCartRules, updateQuantityRules } = require('../validators/cartValidators');

router.get('/', authMiddleware, cartController.getCart);
router.post('/add', authMiddleware, addToCartRules, validate, cartController.addToCart);
router.put('/:id', authMiddleware, updateQuantityRules, validate, cartController.updateQuantity);
router.delete('/:id', authMiddleware, cartController.removeFromCart);
router.delete('/', authMiddleware, cartController.clearCart);

module.exports = router;
