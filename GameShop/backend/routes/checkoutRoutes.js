const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const vnpayController = require('../controllers/vnpayController');
const auth = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  processCheckoutRules,
  ewalletRules,
  savedCardRules,
  deleteCardRules,
  installStatusRules,
  favoriteRules,
} = require('../validators/checkoutValidators');

router.post('/vnpay/create', auth, vnpayController.createVNPayUrl);
router.get('/vnpay/return', vnpayController.vnpayReturn);
router.get('/vnpay/ipn', vnpayController.vnpayIPN);
router.get('/vnpay/status/:txnRef', auth, vnpayController.getVNPayStatus);

router.post('/process', auth, processCheckoutRules, validate, checkoutController.processCheckout);
router.post('/saved-card', auth, savedCardRules, validate, checkoutController.checkoutWithSavedCard);
router.post('/ewallet', auth, ewalletRules, validate, checkoutController.checkoutWithEWallet);
router.get('/cards', auth, checkoutController.getSavedCards);
router.delete('/cards/:id', auth, deleteCardRules, validate, checkoutController.deleteSavedCard);
router.get('/orders', auth, checkoutController.getOrderHistory);
router.get('/library', auth, checkoutController.getLibrary);
router.post('/check-ownership', auth, checkoutController.checkOwnership);
router.patch('/library/:gameId/install', auth, installStatusRules, validate, checkoutController.updateInstallStatus);
router.patch('/library/:gameId/favorite', auth, favoriteRules, validate, checkoutController.updateFavoriteStatus);

module.exports = router;
