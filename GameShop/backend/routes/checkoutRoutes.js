const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const vnpayController    = require('../controllers/vnpayController');
const auth               = require('../middleware/authMiddleware');

// ── VNPay (return/IPN không cần auth — VNPay gọi trực tiếp) ──────────────────
router.post('/vnpay/create',              auth, vnpayController.createVNPayUrl);
router.get('/vnpay/return',                    vnpayController.vnpayReturn);
router.get('/vnpay/ipn',                       vnpayController.vnpayIPN);
router.get('/vnpay/status/:txnRef',       auth, vnpayController.getVNPayStatus);

// ── Thẻ ngân hàng + ví khác ──────────────────────────────────────────────────
router.post('/process',                   auth, checkoutController.processCheckout);
router.post('/saved-card',                auth, checkoutController.checkoutWithSavedCard);
router.post('/ewallet',                   auth, checkoutController.checkoutWithEWallet);
router.get('/cards',                      auth, checkoutController.getSavedCards);
router.delete('/cards/:id',               auth, checkoutController.deleteSavedCard);
router.get('/orders',                     auth, checkoutController.getOrderHistory);
router.get('/library',                    auth, checkoutController.getLibrary);
router.post('/check-ownership',           auth, checkoutController.checkOwnership);
router.patch('/library/:gameId/install',  auth, checkoutController.updateInstallStatus);
router.patch('/library/:gameId/favorite', auth, checkoutController.updateFavoriteStatus);

module.exports = router;
