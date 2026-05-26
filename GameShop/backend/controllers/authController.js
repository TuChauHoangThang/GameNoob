const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const pool = require('../configs/db');

// Đăng ký tài khoản
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng!' });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Lưu vào database
    const newUser = await userModel.createUser(username, email, hashedPassword);

    res.status(201).json({ message: 'Đăng ký thành công!', user: newUser });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng ký.' });
  }
};

// Đăng nhập
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Tìm user theo email
    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });
    }

    // Tạo JWT Token
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
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

// Lấy thông tin user hiện tại (dùng token)
const getMe = async (req, res) => {
  try {
    // req.userId được set bởi authMiddleware
    const result = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Lỗi lấy thông tin user:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

module.exports = {
  register,
  login,
  getMe,
};
