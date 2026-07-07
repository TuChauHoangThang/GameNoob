const jwt = require('jsonwebtoken');

/**
 * Middleware xác thực JWT cho các route được bảo vệ.
 * Đọc token từ header Authorization theo định dạng "Bearer <token>",
 * giải mã và gán req.userId để các controller downstream sử dụng.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const authMiddleware = (req, res, next) => {
  // Kiểm tra header Authorization có tồn tại không
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'Không có token, quyền truy cập bị từ chối' });
  }

  // Tách token từ định dạng "Bearer <token>"
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Định dạng token không hợp lệ' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey_gamenoob');
    req.userId = decoded.user.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

module.exports = authMiddleware;
