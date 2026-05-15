const gameModel = require('../models/gameModel');

// Lấy danh sách game (có phân trang)
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

// Lấy chi tiết game theo ID
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

