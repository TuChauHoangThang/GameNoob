const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình multer — ảnh + video tối đa 100MB
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const prefix = file.mimetype.startsWith('video/') ? 'video' : 'img';
    cb(null, `post_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const ALLOWED_TYPES = {
  'image/jpeg': true,
  'image/png': true,
  'image/gif': true,
  'image/webp': true,
  'video/mp4': true,
  'video/webm': true,
  'video/ogg': true,
  'video/quicktime': true, // .mov
};

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES[file.mimetype]) cb(null, true);
  else cb(new Error('Chỉ chấp nhận ảnh (jpg, png, gif, webp) hoặc video (mp4, webm, mov)'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// Xử lý lỗi multer
const handleUpload = (req, res, next) => {
  upload.single('media')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File quá lớn. Tối đa 100MB.' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// Optional auth middleware
const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return next();
  const token = authHeader.split(' ')[1];
  if (!token) return next();
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey_gamenoob');
    req.userId = decoded.user.id;
  } catch (e) { /* token lỗi — bỏ qua */ }
  next();
};

// Public
router.get('/', optionalAuth, postController.getPosts);
router.get('/:postId/comments', postController.getComments);

// Protected
router.post('/', authMiddleware, handleUpload, postController.createPost);
router.put('/:postId', authMiddleware, postController.updatePost);
router.post('/:postId/like', authMiddleware, postController.toggleLike);
router.post('/:postId/comments', authMiddleware, postController.addComment);
router.put('/comments/:commentId', authMiddleware, postController.updateComment);
router.delete('/comments/:commentId', authMiddleware, postController.deleteComment);
router.delete('/:postId', authMiddleware, postController.deletePost);

module.exports = router;
