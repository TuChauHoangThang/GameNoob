const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  registerRules,
  loginRules,
  updateProfileRules,
  verifyOtpRules,
  resendOtpRules,
  forgotPasswordRules,
  resetPasswordRules,
} = require('../validators/authValidators');

// ── Auth routes ──────────────────────────────────────────────────────────────
router.post('/register', registerRules, validate, authController.register);
router.post('/login', loginRules, validate, authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.put('/profile', authMiddleware, updateProfileRules, validate, authController.updateProfile);

// ── OTP routes ───────────────────────────────────────────────────────────────
router.post('/verify-otp', verifyOtpRules, validate, authController.verifyOtp);
router.post('/resend-otp', resendOtpRules, validate, authController.resendOtp);

// ── Forgot password routes ───────────────────────────────────────────────────
router.post('/forgot-password', forgotPasswordRules, validate, authController.forgotPassword);
router.post('/verify-forgot-otp', verifyOtpRules, validate, authController.verifyForgotOtp);
router.post('/reset-password', resetPasswordRules, validate, authController.resetPassword);

module.exports = router;
