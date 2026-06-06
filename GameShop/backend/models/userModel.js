const pool = require('../configs/db');

/**
 * Tìm người dùng theo địa chỉ email.
 * Dùng để kiểm tra email đã tồn tại khi đăng ký và xác thực khi đăng nhập.
 * @param {string} email - Địa chỉ email cần tìm
 * @returns {object|undefined} Thông tin user bao gồm password hash, hoặc undefined nếu không tìm thấy
 */
const getUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

/**
 * Tạo người dùng mới trong cơ sở dữ liệu.
 * Mật khẩu phải được hash trước khi truyền vào hàm này.
 * @param {string} username - Tên hiển thị của người dùng
 * @param {string} email - Địa chỉ email (unique)
 * @param {string} hashedPassword - Mật khẩu đã được mã hóa bằng bcrypt
 * @returns {object} Thông tin user mới tạo (id, username, email)
 */
const createUser = async (username, email, hashedPassword) => {
  const result = await pool.query(
    'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
    [username, email, hashedPassword]
  );
  return result.rows[0];
};

module.exports = {
  getUserByEmail,
  createUser,
};
