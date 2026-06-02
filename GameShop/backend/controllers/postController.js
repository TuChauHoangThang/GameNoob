const postModel = require('../models/postModel');

// Lấy danh sách bài post
exports.getPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const userId = req.userId || null;
    const posts = await postModel.getPosts(limit, offset, userId);
    res.json({ success: true, data: posts });
  } catch (err) {
    console.error('Lỗi getPosts:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy comments của post
exports.getComments = async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const comments = await postModel.getComments(postId);
    res.json({ success: true, data: comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Tạo bài post mới
exports.createPost = async (req, res) => {
  try {
    const userId = req.userId;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung không được để trống.' });
    }
    if (content.length > 2000) {
      return res.status(400).json({ success: false, message: 'Nội dung quá dài (tối đa 2000 ký tự).' });
    }

    let mediaUrl = null;
    let mediaType = null;

    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
      mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    } else if (req.body.image_url) {
      mediaUrl = req.body.image_url;
      mediaType = 'image';
    }

    const post = await postModel.createPost(userId, content.trim(), mediaUrl, mediaType);
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    console.error('Lỗi createPost:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Sửa bài post
exports.updatePost = async (req, res) => {
  try {
    const userId = req.userId;
    const postId = parseInt(req.params.postId);
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung không được để trống.' });
    }
    if (content.length > 2000) {
      return res.status(400).json({ success: false, message: 'Nội dung quá dài (tối đa 2000 ký tự).' });
    }
    const updated = await postModel.updatePost(postId, userId, content.trim());
    if (!updated) {
      return res.status(403).json({ success: false, message: 'Không có quyền sửa bài này.' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Thêm comment
exports.addComment = async (req, res) => {
  try {
    const userId = req.userId;
    const postId = parseInt(req.params.postId);
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung comment không được để trống.' });
    }
    const comment = await postModel.addComment(userId, postId, content.trim());
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Sửa comment
exports.updateComment = async (req, res) => {
  try {
    const userId = req.userId;
    const commentId = parseInt(req.params.commentId);
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung không được để trống.' });
    }
    const updated = await postModel.updateComment(commentId, userId, content.trim());
    if (!updated) {
      return res.status(403).json({ success: false, message: 'Không có quyền sửa comment này.' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Xóa comment
exports.deleteComment = async (req, res) => {
  try {
    const userId = req.userId;
    const commentId = parseInt(req.params.commentId);
    const deleted = await postModel.deleteComment(commentId, userId);
    if (!deleted) {
      return res.status(403).json({ success: false, message: 'Không có quyền xóa comment này.' });
    }
    res.json({ success: true, message: 'Đã xóa bình luận.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Toggle like
exports.toggleLike = async (req, res) => {
  try {
    const userId = req.userId;
    const postId = parseInt(req.params.postId);
    const result = await postModel.toggleLike(userId, postId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Xóa post
exports.deletePost = async (req, res) => {
  try {
    const userId = req.userId;
    const postId = parseInt(req.params.postId);
    const deleted = await postModel.deletePost(postId, userId);
    if (!deleted) {
      return res.status(403).json({ success: false, message: 'Không có quyền xóa bài này.' });
    }
    res.json({ success: true, message: 'Đã xóa bài viết.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
