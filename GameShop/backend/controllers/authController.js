const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

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

module.exports = {
  register,
  login
};
