const gameModel = require('../models/gameModel');
const axios = require('axios');

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

// Tải ảnh bìa game (proxy download)
exports.downloadGame = async (req, res) => {
  try {
    const game = await gameModel.getGameById(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game không tồn tại' });
    }

    const imageUrl = game.header_image;
    if (!imageUrl) {
      return res.status(404).json({ success: false, message: 'Không có ảnh bìa cho game này' });
    }

    // Tạo tên file an toàn từ tên game
    const safeName = game.name
      .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s\-_]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 80);
    const fileName = `${safeName}_cover.jpg`;

    // Fetch ảnh từ URL gốc
    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      timeout: 15000,
    });

    // Set headers để browser download file
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    // Pipe stream trực tiếp
    response.data.pipe(res);
  } catch (error) {
    console.error('Lỗi tải game:', error.message);
    res.status(500).json({ success: false, message: 'Không thể tải file game.' });
  }
};

