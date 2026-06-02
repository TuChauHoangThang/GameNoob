const gameModel = require('../models/gameModel');

/**
 * Lấy danh sách sản phẩm game (hỗ trợ phân trang, tìm kiếm theo tên, lọc theo thể loại hoặc lọc game miễn phí).
 * @route GET /api/games
 * @param {object} req - Express request object (query parameters: limit, offset, genre, q, free)
 * @param {object} res - Express response object
 */
exports.getGames = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const genre = req.query.genre;
    const search = req.query.q;
    const free = req.query.free;
    
    let games;
    if (search) {
      games = await gameModel.searchGames(search, limit, offset);
    } else if (genre) {
      games = await gameModel.getGamesByGenre(genre, limit, offset);
    } else if (free === 'true') {
      games = await gameModel.getFreeGames(limit, offset);
    } else {
      games = await gameModel.getAllGames(limit, offset);
    }
    res.json({
      success: true,
      count: games.length,
      data: games
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lấy thông tin chi tiết của một game cụ thể dựa theo ID.
 * @route GET /api/games/:id
 * @param {object} req - Express request object (params: id)
 * @param {object} res - Express response object
 */
exports.getGameById = async (req, res) => {
  try {
    const game = await gameModel.getGameById(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game không tồn tại' });
    }
    res.json({
      success: true,
      data: game
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
