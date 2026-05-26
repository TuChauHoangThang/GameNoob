const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const authMiddleware = require('../middleware/authMiddleware');

// Public: lấy danh sách rating + thống kê của game
router.get('/:gameId', ratingController.getGameRatings);

// Protected: lấy rating của user hiện tại
router.get('/:gameId/my', authMiddleware, ratingController.getMyRating);

// Protected: gửi rating (chỉ user đã mua game)
router.post('/:gameId', authMiddleware, ratingController.submitRating);

module.exports = router;
