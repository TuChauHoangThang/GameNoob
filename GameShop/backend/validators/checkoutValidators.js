const { body, param } = require('express-validator');

const processCheckoutRules = [
  body('cardNumber')
    .notEmpty().withMessage('Số thẻ không được để trống')
    .custom((val) => /^\d{16}$/.test(val.replace(/\s/g, '')))
    .withMessage('Số thẻ không hợp lệ. Vui lòng nhập 16 chữ số'),
  body('holderName')
    .trim()
    .notEmpty().withMessage('Tên chủ thẻ không được để trống')
    .isLength({ max: 100 }).withMessage('Tên chủ thẻ quá dài'),
  body('expiryMonth')
    .isInt({ min: 1, max: 12 }).withMessage('Tháng hết hạn phải từ 1–12'),
  body('expiryYear')
    .isInt({ min: new Date().getFullYear() }).withMessage('Năm hết hạn không hợp lệ'),
  body('cvv')
    .matches(/^\d{3,4}$/).withMessage('Mã CVV không hợp lệ'),
];

const ewalletRules = [
  body('provider')
    .notEmpty().withMessage('Thiếu nhà cung cấp ví')
    .isIn(['momo', 'zalopay']).withMessage('Ví không được hỗ trợ'),
  body('confirmCode')
    .trim()
    .notEmpty().withMessage('Mã xác nhận không hợp lệ')
    .isLength({ min: 4 }).withMessage('Mã xác nhận không hợp lệ'),
];

const savedCardRules = [
  body('cardId')
    .isInt({ min: 1 }).withMessage('cardId không hợp lệ'),
  body('cvv')
    .matches(/^\d{3,4}$/).withMessage('Mã CVV không hợp lệ'),
];

const deleteCardRules = [
  param('id').isInt({ min: 1 }).withMessage('ID thẻ không hợp lệ'),
];

const libraryGameRules = [
  param('gameId').isInt({ min: 1 }).withMessage('Game ID không hợp lệ'),
];

const installStatusRules = [
  ...libraryGameRules,
  body('status')
    .isIn(['not_installed', 'installing', 'installed'])
    .withMessage('Trạng thái cài đặt không hợp lệ'),
];

const favoriteRules = [
  ...libraryGameRules,
  body('isFavorite').isBoolean().withMessage('isFavorite phải là boolean'),
];

module.exports = {
  processCheckoutRules,
  ewalletRules,
  savedCardRules,
  deleteCardRules,
  installStatusRules,
  favoriteRules,
};
