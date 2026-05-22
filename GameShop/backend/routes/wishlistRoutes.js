const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware); // Yêu cầu đăng nhập cho tất cả route wishlist

router.get('/', wishlistController.getWishlist);
router.post('/', wishlistController.addGameToWishlist);
router.delete('/:gameId', wishlistController.removeGameFromWishlist);

module.exports = router;
