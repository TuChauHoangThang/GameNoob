const { body } = require('express-validator');

const registerRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('Tên người dùng không được để trống')
    .isLength({ min: 3, max: 50 }).withMessage('Tên người dùng phải từ 3–50 ký tự'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Mật khẩu không được để trống')
    .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Mật khẩu không được để trống'),
];

const updateProfileRules = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Tên người dùng phải từ 3–50 ký tự'),
  body('newPassword')
    .optional()
    .isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
  body('currentPassword')
    .if(body('newPassword').exists())
    .notEmpty().withMessage('Vui lòng nhập mật khẩu hiện tại khi đổi mật khẩu'),
];

// ── OTP Validators ───────────────────────────────────────────────────────────

const verifyOtpRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('otp')
    .trim()
    .notEmpty().withMessage('Mã OTP không được để trống')
    .isLength({ min: 6, max: 6 }).withMessage('Mã OTP phải có 6 chữ số')
    .isNumeric().withMessage('Mã OTP chỉ chứa số'),
];

const resendOtpRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
];

const forgotPasswordRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
];

const resetPasswordRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('otp')
    .trim()
    .notEmpty().withMessage('Mã OTP không được để trống')
    .isLength({ min: 6, max: 6 }).withMessage('Mã OTP phải có 6 chữ số')
    .isNumeric().withMessage('Mã OTP chỉ chứa số'),
  body('newPassword')
    .notEmpty().withMessage('Mật khẩu mới không được để trống')
    .isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
];

module.exports = {
  registerRules,
  loginRules,
  updateProfileRules,
  verifyOtpRules,
  resendOtpRules,
  forgotPasswordRules,
  resetPasswordRules,
};
