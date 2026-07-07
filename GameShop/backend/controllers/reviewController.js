const reviewModel = require('../models/reviewModel');

/**
 * Lấy tất cả đánh giá (reviews) và thống kê xếp hạng (stats) của một tựa game.
 * @route GET /api/reviews/game/:gameId
 * @param {object} req - Express request object (params: gameId)
 * @param {object} res - Express response object
 */
const getGameReviews = async (req, res) => {
  try {
    const { gameId } = req.params;
    const [reviews, stats] = await Promise.all([
      reviewModel.getReviewsByGameId(gameId),
      reviewModel.getRatingStats(gameId),
    ]);
    res.json({ success: true, data: reviews, stats });
  } catch (error) {
    console.error('Lỗi lấy review:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * Tạo đánh giá mới cho một tựa game (yêu cầu đăng nhập, mỗi user chỉ đánh giá 1 lần/game).
 * @route POST /api/reviews/game/:gameId
 * @param {object} req - Express request object (params: gameId, body: rating, content)
 * @param {object} res - Express response object
 */
const createReview = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { rating, content } = req.body;
    const userId = req.userId;

    // Validate
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating phải từ 1 đến 5.' });
    }
    if (!content || content.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Nội dung review phải có ít nhất 10 ký tự.' });
    }

    // Kiểm tra đã review chưa
    const existing = await reviewModel.getUserReview(userId, gameId);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bạn đã đánh giá game này rồi.' });
    }

    const review = await reviewModel.createReview(userId, gameId, rating, content.trim());
    res.status(201).json({ success: true, message: 'Đánh giá thành công!', data: review });
  } catch (error) {
    console.error('Lỗi tạo review:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * Cập nhật nội dung và số sao đánh giá (chỉ chủ sở hữu đánh giá mới có quyền).
 * @route PUT /api/reviews/:reviewId
 * @param {object} req - Express request object (params: reviewId, body: rating, content)
 * @param {object} res - Express response object
 */
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, content } = req.body;
    const userId = req.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating phải từ 1 đến 5.' });
    }
    if (!content || content.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Nội dung review phải có ít nhất 10 ký tự.' });
    }

    const updated = await reviewModel.updateReview(reviewId, userId, rating, content.trim());
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy review hoặc bạn không có quyền sửa.' });
    }
    res.json({ success: true, message: 'Cập nhật đánh giá thành công!', data: updated });
  } catch (error) {
    console.error('Lỗi cập nhật review:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * Xóa đánh giá game (chỉ chủ sở hữu đánh giá mới có quyền).
 * @route DELETE /api/reviews/:reviewId
 * @param {object} req - Express request object (params: reviewId)
 * @param {object} res - Express response object
 */
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.userId;

    const deleted = await reviewModel.deleteReview(reviewId, userId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy review hoặc bạn không có quyền xóa.' });
    }
    res.json({ success: true, message: 'Đã xóa đánh giá.' });
  } catch (error) {
    console.error('Lỗi xóa review:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * Lấy đánh giá cá nhân của người dùng hiện tại đối với một tựa game cụ thể.
 * @route GET /api/reviews/game/:gameId/my-review
 * @param {object} req - Express request object (params: gameId)
 * @param {object} res - Express response object
 */
const getMyReview = async (req, res) => {
  try {
    const { gameId } = req.params;
    const review = await reviewModel.getUserReview(req.userId, gameId);
    res.json({ success: true, data: review || null });
  } catch (error) {
    console.error('Lỗi lấy my review:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

module.exports = {
  getGameReviews,
  createReview,
  updateReview,
  deleteReview,
  getMyReview,
};
