const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { gameIdParam, submitRatingRules } = require('../validators/ratingValidators');

router.get('/:gameId', gameIdParam, validate, ratingController.getGameRatings);
router.get('/:gameId/my', authMiddleware, gameIdParam, validate, ratingController.getMyRating);
router.post('/:gameId', authMiddleware, submitRatingRules, validate, ratingController.submitRating);

module.exports = router;
