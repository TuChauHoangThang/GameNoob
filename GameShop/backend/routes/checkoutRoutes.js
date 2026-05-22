const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { authenticate } = require('../controllers/cartController');

// Tất cả route đều yêu cầu đăng nhập
router.post('/process', authenticate, checkoutController.processCheckout);
router.post('/saved-card', authenticate, checkoutController.checkoutWithSavedCard);
router.get('/cards', authenticate, checkoutController.getSavedCards);
router.delete('/cards/:id', authenticate, checkoutController.deleteSavedCard);
router.get('/orders', authenticate, checkoutController.getOrderHistory);
router.get('/library', authenticate, checkoutController.getLibrary);
router.post('/check-ownership', authenticate, checkoutController.checkOwnership);
router.patch('/library/:gameId/install', authenticate, checkoutController.updateInstallStatus);
router.patch('/library/:gameId/favorite', authenticate, checkoutController.updateFavoriteStatus);

module.exports = router;
