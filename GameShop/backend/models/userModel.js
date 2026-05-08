const pool = require('../configs/db');

// Tìm người dùng theo email
const getUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

// Tạo người dùng mới
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
