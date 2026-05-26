const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const authMiddleware = require('../middleware/authMiddleware');

// Tất cả route đều yêu cầu đăng nhập
router.post('/process', authMiddleware, checkoutController.processCheckout);
router.post('/saved-card', authMiddleware, checkoutController.checkoutWithSavedCard);
router.get('/cards', authMiddleware, checkoutController.getSavedCards);
router.delete('/cards/:id', authMiddleware, checkoutController.deleteSavedCard);
router.get('/orders', authMiddleware, checkoutController.getOrderHistory);
router.get('/library', authMiddleware, checkoutController.getLibrary);
router.post('/check-ownership', authMiddleware, checkoutController.checkOwnership);
router.patch('/library/:gameId/install', authMiddleware, checkoutController.updateInstallStatus);
router.patch('/library/:gameId/favorite', authMiddleware, checkoutController.updateFavoriteStatus);

module.exports = router;
