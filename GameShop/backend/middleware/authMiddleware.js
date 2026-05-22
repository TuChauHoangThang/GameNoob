const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Check header
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'Không có token, quyền truy cập bị từ chối' });
  }

  // Get token from "Bearer <token>"
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
