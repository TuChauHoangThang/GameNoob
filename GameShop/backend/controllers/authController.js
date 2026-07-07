const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { User } = require('../orm');
const { generateOTP, sendOtpEmail } = require('../utils/emailService');

// ── Đăng ký (tạo user + gửi OTP) ────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      // Nếu user đã tồn tại nhưng chưa verify, cho phép gửi lại OTP
      if (!existingUser.is_verified) {
        const otp = generateOTP();
        existingUser.otp_code = otp;
        existingUser.otp_expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 phút
        // Cập nhật lại username/password nếu user đăng ký lại
        existingUser.username = username;
        const salt = await bcrypt.genSalt(10);
        existingUser.password = await bcrypt.hash(password, salt);
        await existingUser.save();

        await sendOtpEmail(email, otp, 'register');
        return res.status(200).json({
          message: 'Mã OTP đã được gửi lại đến email của bạn.',
          email,
        });
      }
      return res.status(400).json({ message: 'Email đã được sử dụng!' });
    }

    // Tạo user mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOTP();

    await User.create({
      username,
      email,
      password: hashedPassword,
      is_verified: false,
      otp_code: otp,
      otp_expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 phút
    });

    await sendOtpEmail(email, otp, 'register');

    res.status(201).json({
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để nhận mã OTP.',
      email,
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng ký.' });
  }
};

// ── Xác thực OTP (cho đăng ký) ──────────────────────────────────────────────
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Email không tồn tại.' });
    }

    if (user.is_verified) {
      return res.status(400).json({ message: 'Tài khoản đã được xác thực.' });
    }

    if (!user.otp_code || user.otp_code !== otp) {
      return res.status(400).json({ message: 'Mã OTP không đúng.' });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn. Vui lòng gửi lại.' });
    }

    // Xác thực thành công
    user.is_verified = true;
    user.otp_code = null;
    user.otp_expires_at = null;
    await user.save();

    res.json({ message: 'Xác thực tài khoản thành công! Bạn có thể đăng nhập.' });
  } catch (error) {
    console.error('Lỗi xác thực OTP:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

// ── Gửi lại OTP ─────────────────────────────────────────────────────────────
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Email không tồn tại.' });
    }

    if (user.is_verified) {
      return res.status(400).json({ message: 'Tài khoản đã được xác thực.' });
    }

    const otp = generateOTP();
    user.otp_code = otp;
    user.otp_expires_at = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await sendOtpEmail(email, otp, 'register');

    res.json({ message: 'Đã gửi lại mã OTP đến email của bạn.' });
  } catch (error) {
    console.error('Lỗi gửi lại OTP:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

// ── Đăng nhập ────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });
    }

    // Kiểm tra đã xác thực email chưa
    if (!user.is_verified) {
      return res.status(403).json({
        message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email.',
        needVerification: true,
        email: user.email,
      });
    }

    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secretkey_gamenoob',
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({ message: 'Đăng nhập thành công!', token, user: payload.user });
      }
    );
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập.' });
  }
};

// ── Quên mật khẩu (gửi OTP) ─────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Email không tồn tại trong hệ thống.' });
    }

    const otp = generateOTP();
    user.otp_code = otp;
    user.otp_expires_at = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await sendOtpEmail(email, otp, 'forgot');

    res.json({ message: 'Mã OTP đã được gửi đến email của bạn.', email });
  } catch (error) {
    console.error('Lỗi quên mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

// ── Xác thực OTP quên mật khẩu ──────────────────────────────────────────────
const verifyForgotOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Email không tồn tại.' });
    }

    if (!user.otp_code || user.otp_code !== otp) {
      return res.status(400).json({ message: 'Mã OTP không đúng.' });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn. Vui lòng gửi lại.' });
    }

    res.json({ message: 'Xác thực OTP thành công. Bạn có thể đặt mật khẩu mới.', verified: true });
  } catch (error) {
    console.error('Lỗi xác thực OTP quên mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

// ── Đặt lại mật khẩu ────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Email không tồn tại.' });
    }

    if (!user.otp_code || user.otp_code !== otp) {
      return res.status(400).json({ message: 'Mã OTP không đúng.' });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn. Vui lòng gửi lại.' });
    }

    // Đổi mật khẩu
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp_code = null;
    user.otp_expires_at = null;
    await user.save();

    res.json({ message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập.' });
  } catch (error) {
    console.error('Lỗi đặt lại mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

// ── Cập nhật profile ─────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!username && !newPassword) {
      return res.status(400).json({ message: 'Vui lòng cung cấp thông tin cần cập nhật.' });
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }

    if (newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng.' });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (username) {
      user.username = username.trim();
    }

    await user.save();

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công!',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Lỗi cập nhật profile:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

// ── Lấy thông tin user hiện tại ──────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'username', 'email', 'is_admin', 'created_at'],
    });
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }
    res.json({ success: true, user: user.get({ plain: true }) });
  } catch (error) {
    console.error('Lỗi lấy thông tin user:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  verifyForgotOtp,
  resetPassword,
  updateProfile,
  getMe,
};
