const { body, param } = require('express-validator');

const gameIdParam = [
  param('gameId').isInt({ min: 1 }).withMessage('Game ID không hợp lệ'),
];

const submitRatingRules = [
  ...gameIdParam,
  body('is_positive')
    .isBoolean().withMessage('Vui lòng chọn Tích cực hoặc Tiêu cực'),
  body('stars')
    .isInt({ min: 1, max: 5 }).withMessage('Số sao phải từ 1 đến 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Bình luận tối đa 1000 ký tự'),
];

module.exports = { gameIdParam, submitRatingRules };
