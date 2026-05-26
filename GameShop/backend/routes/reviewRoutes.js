const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

// Public: lấy review + stats của game
router.get('/game/:gameId', reviewController.getGameReviews);

// Protected: CRUD review
router.get('/game/:gameId/my', authMiddleware, reviewController.getMyReview);
router.post('/game/:gameId', authMiddleware, reviewController.createReview);
router.put('/:reviewId', authMiddleware, reviewController.updateReview);
router.delete('/:reviewId', authMiddleware, reviewController.deleteReview);

module.exports = router;
