const { body, param } = require('express-validator');

const addToCartRules = [
  body('gameId')
    .notEmpty().withMessage('Thiếu gameId')
    .isInt({ min: 1 }).withMessage('gameId phải là số nguyên dương'),
];

const updateQuantityRules = [
  param('id').isInt({ min: 1 }).withMessage('ID giỏ hàng không hợp lệ'),
  body('quantity')
    .isInt({ min: 0 }).withMessage('Số lượng phải là số nguyên không âm'),
];

module.exports = { addToCartRules, updateQuantityRules };
