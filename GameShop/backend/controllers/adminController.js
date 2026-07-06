const { Op } = require('sequelize');
const { User, Game, Order, sequelize } = require('../orm');

const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, { attributes: ['is_admin'] });
    if (!user || !user.is_admin) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập trang Admin.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xác thực quyền admin.' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const [users, games, orders, revenue, topGames, recentRevenue, recentOrders] = await Promise.all([
      User.count(),
      Game.count(),
      Order.count(),
      Order.sum('total_amount'),
      sequelize.query(
        `SELECT g.id, g.name, g.header_image, g.price_vnd, g.is_free,
                COUNT(oi.id) as sold_count,
                SUM(COALESCE(oi.price_at_purchase, 0)) as revenue
         FROM games g
         JOIN order_items oi ON oi.game_id = g.id
         GROUP BY g.id, g.name, g.header_image, g.price_vnd, g.is_free
         ORDER BY sold_count DESC
         LIMIT 5`,
        { type: sequelize.QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total_amount) as revenue
         FROM orders
         WHERE created_at >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        { type: sequelize.QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT o.id, o.total_amount, o.created_at, o.payment_method, o.card_last_four,
                u.username, u.email, COUNT(oi.id) as item_count
         FROM orders o
         JOIN users u ON o.user_id = u.id
         JOIN order_items oi ON oi.order_id = o.id
         GROUP BY o.id, o.total_amount, o.created_at, o.payment_method, o.card_last_four, u.username, u.email
         ORDER BY o.created_at DESC
         LIMIT 10`,
        { type: sequelize.QueryTypes.SELECT }
      ),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers: users,
        totalGames: games,
        totalOrders: orders,
        totalRevenue: parseFloat(revenue || 0),
      },
      topGames,
      recentRevenue,
      recentOrders,
    });
  } catch (error) {
    console.error('Lỗi dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.q;

    const users = await User.findAll({
      where: search
        ? {
            [Op.or]: [
              { username: { [Op.iLike]: `%${search}%` } },
              { email: { [Op.iLike]: `%${search}%` } },
            ],
          }
        : undefined,
      attributes: ['id', 'username', 'email', 'is_admin', 'created_at'],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({ success: true, data: users.map((u) => u.get({ plain: true })), count: users.length });
  } catch (error) {
    console.error('Lỗi lấy users:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

const getAllGamesAdmin = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.q;

    const games = await Game.findAll({
      where: search ? { name: { [Op.iLike]: `%${search}%` } } : undefined,
      attributes: ['id', 'name', 'header_image', 'price_vnd', 'is_free', 'steam_appid'],
      order: [['id', 'DESC']],
      limit,
      offset,
    });

    res.json({ success: true, data: games.map((g) => g.get({ plain: true })), count: games.length });
  } catch (error) {
    console.error('Lỗi lấy games (admin):', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

const updateGamePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { price_vnd, is_free } = req.body;

    const game = await Game.findByPk(id);
    if (!game) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy game.' });
    }

    await game.update({ price_vnd, is_free });
    res.json({
      success: true,
      message: 'Cập nhật giá thành công!',
      data: { id: game.id, name: game.name, price_vnd: game.price_vnd, is_free: game.is_free },
    });
  } catch (error) {
    console.error('Lỗi cập nhật game:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

const deleteGame = async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy game.' });
    }
    const name = game.name;
    await game.destroy();
    res.json({ success: true, message: `Đã xóa game "${name}".` });
  } catch (error) {
    console.error('Lỗi xóa game:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

module.exports = {
  requireAdmin,
  getDashboardStats,
  getAllUsers,
  getAllGamesAdmin,
  updateGamePrice,
  deleteGame,
};
