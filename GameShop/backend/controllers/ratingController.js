const ratingModel = require('../models/ratingModel');
const libraryModel = require('../models/libraryModel');
const pool = require('../configs/db');

// Lấy danh sách rating + thống kê của một game
exports.getGameRatings = async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId);
    if (isNaN(gameId)) {
      return res.status(400).json({ success: false, message: 'Game ID không hợp lệ' });
    }

    const [ratings, stats] = await Promise.all([
      ratingModel.getRatingsByGameId(gameId),
      ratingModel.getRatingStats(gameId),
    ]);

    res.json({
      success: true,
      stats: {
        total_ratings: parseInt(stats.total_ratings) || 0,
        positive_count: parseInt(stats.positive_count) || 0,
        negative_count: parseInt(stats.negative_count) || 0,
        avg_stars: parseFloat(stats.avg_stars) || 0,
      },
      ratings,
    });
  } catch (error) {
    console.error('Lỗi getGameRatings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy rating của user hiện tại cho một game
exports.getMyRating = async (req, res) => {
  try {
    const userId = req.userId;
    const gameId = parseInt(req.params.gameId);

    const rating = await ratingModel.getUserRating(userId, gameId);
    res.json({ success: true, rating: rating || null });
  } catch (error) {
    console.error('Lỗi getMyRating:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Gửi rating (chỉ user đã mua game mới được)
exports.submitRating = async (req, res) => {
  try {
    const userId = req.userId;
    const gameId = parseInt(req.params.gameId);

    if (isNaN(gameId)) {
      return res.status(400).json({ success: false, message: 'Game ID không hợp lệ' });
    }

    // Kiểm tra user đã mua game chưa
    const owned = await libraryModel.isGameOwned(userId, gameId);
    if (!owned) {
      return res.status(403).json({
        success: false,
        message: 'Bạn cần mua game này trước khi đánh giá.',
      });
    }

    // Kiểm tra đã rating chưa (chỉ được rating 1 lần)
    const existing = await ratingModel.getUserRating(userId, gameId);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Bạn đã đánh giá game này rồi.',
      });
    }

    const { is_positive, stars, comment } = req.body;

    // Validate
    if (typeof is_positive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn Tích cực hoặc Tiêu cực.' });
    }
    const starsNum = parseInt(stars);
    if (!starsNum || starsNum < 1 || starsNum > 5) {
      return res.status(400).json({ success: false, message: 'Số sao phải từ 1 đến 5.' });
    }

    // Lưu rating
    const newRating = await ratingModel.createRating(userId, gameId, is_positive, starsNum, comment);

    res.status(201).json({ success: true, rating: newRating });
  } catch (error) {
    // Unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Bạn đã đánh giá game này rồi.' });
    }
    console.error('Lỗi submitRating:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
