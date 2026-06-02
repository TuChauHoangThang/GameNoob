const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const vnpayController    = require('../controllers/vnpayController');
const authMiddleware     = require('../middleware/authMiddleware');
const { authenticate }   = require('../controllers/cartController');

// ── VNPay (return/IPN không cần auth — VNPay gọi trực tiếp) ──────────────────
router.post('/vnpay/create',          authenticate, vnpayController.createVNPayUrl);
router.get('/vnpay/return',           vnpayController.vnpayReturn);
router.get('/vnpay/ipn',              vnpayController.vnpayIPN);
router.get('/vnpay/status/:txnRef',   authenticate, vnpayController.getVNPayStatus);

// ── Thẻ ngân hàng + ví khác ──────────────────────────────────────────────────
router.post('/process',               authenticate, checkoutController.processCheckout);
router.post('/saved-card',            authenticate, checkoutController.checkoutWithSavedCard);
router.post('/ewallet',               authenticate, checkoutController.checkoutWithEWallet);
router.get('/cards',                  authenticate, checkoutController.getSavedCards);
router.delete('/cards/:id',           authenticate, checkoutController.deleteSavedCard);
router.get('/orders',                 authenticate, checkoutController.getOrderHistory);
router.get('/library',                authenticate, checkoutController.getLibrary);
router.post('/check-ownership',       authenticate, checkoutController.checkOwnership);
router.patch('/library/:gameId/install',  authenticate, checkoutController.updateInstallStatus);
router.patch('/library/:gameId/favorite', authenticate, checkoutController.updateFavoriteStatus);

module.exports = router;
