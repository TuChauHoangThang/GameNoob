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
    const [users, games, orders, revenue, topGames, recentRevenue, recentOrders,
      topGamesFull, userGrowth, paymentStats, topSpenders] = await Promise.all([
      User.count(),
      Game.count(),
      Order.count(),
      Order.sum('total_amount'),

      // Top 5 game bán chạy (cho bảng)
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

      // Doanh thu 7 ngày gần nhất
      sequelize.query(
        `SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total_amount) as revenue
         FROM orders
         WHERE created_at >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        { type: sequelize.QueryTypes.SELECT }
      ),

      // 10 đơn hàng gần nhất
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

      // Top 10 game bán chạy cho biểu đồ cột
      sequelize.query(
        `SELECT g.name, COUNT(oi.id) as sold_count,
                SUM(COALESCE(oi.price_at_purchase, 0)) as revenue
         FROM games g
         JOIN order_items oi ON oi.game_id = g.id
         GROUP BY g.id, g.name
         ORDER BY sold_count DESC
         LIMIT 10`,
        { type: sequelize.QueryTypes.SELECT }
      ),

      // Người dùng đăng ký theo tháng (6 tháng gần nhất)
      sequelize.query(
        `SELECT TO_CHAR(created_at, 'MM/YYYY') as month,
                COUNT(*) as count
         FROM users
         WHERE created_at >= NOW() - INTERVAL '6 months'
         GROUP BY TO_CHAR(created_at, 'MM/YYYY'), DATE_TRUNC('month', created_at)
         ORDER BY DATE_TRUNC('month', created_at) ASC`,
        { type: sequelize.QueryTypes.SELECT }
      ),

      // Thống kê phương thức thanh toán
      sequelize.query(
        `SELECT 
           CASE 
             WHEN payment_method IN ('Visa', 'Mastercard', 'Napas', 'Thẻ ngân hàng') THEN 'Thẻ ngân hàng'
             WHEN payment_method LIKE 'VNPay%' OR payment_method = 'VNPay' THEN 'VNPay'
           END as payment_method,
           COUNT(*) as count,
           SUM(total_amount) as total
         FROM orders
         WHERE payment_method IN ('Visa', 'Mastercard', 'Napas', 'Thẻ ngân hàng') 
            OR payment_method LIKE 'VNPay%' 
            OR payment_method = 'VNPay'
         GROUP BY 
           CASE 
             WHEN payment_method IN ('Visa', 'Mastercard', 'Napas', 'Thẻ ngân hàng') THEN 'Thẻ ngân hàng'
             WHEN payment_method LIKE 'VNPay%' OR payment_method = 'VNPay' THEN 'VNPay'
           END
         ORDER BY count DESC`,
        { type: sequelize.QueryTypes.SELECT }
      ),

      // Top 10 người dùng chi tiêu nhiều nhất
      sequelize.query(
        `SELECT u.id, u.username, u.email, u.created_at,
                COUNT(DISTINCT o.id)  AS order_count,
                COUNT(oi.id)          AS game_count,
                SUM(o.total_amount)   AS total_spent
         FROM users u
         JOIN orders o  ON o.user_id  = u.id
         JOIN order_items oi ON oi.order_id = o.id
         GROUP BY u.id, u.username, u.email, u.created_at
         ORDER BY total_spent DESC
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
      topGamesFull,
      userGrowth,
      paymentStats,
      topSpenders,
    });
  } catch (error) {
    console.error('Lỗi dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

const parsePage = (raw, fallback = 1) => Math.max(parseInt(raw, 10) || fallback, 1);
const parseLimit = (raw, fallback = 20, max = 50) =>
  Math.min(Math.max(parseInt(raw, 10) || fallback, 1), max);

const buildPagination = (total, limit, page) => ({
  total,
  limit,
  page,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});

const getAllUsers = async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit);
    const page = parsePage(req.query.page);
    const offset = (page - 1) * limit;
    const search = req.query.q?.trim();
    const role = req.query.role || 'all';
    const sort = req.query.sort || 'newest';

    const where = {};
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (role === 'admin') where.is_admin = true;
    if (role === 'user') where.is_admin = false;

    const orderMap = {
      newest: [['created_at', 'DESC']],
      oldest: [['created_at', 'ASC']],
      name_asc: [['username', 'ASC']],
      name_desc: [['username', 'DESC']],
    };

    const { rows, count } = await User.findAndCountAll({
      where: Object.keys(where).length ? where : undefined,
      attributes: ['id', 'username', 'email', 'is_admin', 'created_at'],
      order: orderMap[sort] || orderMap.newest,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: rows.map((u) => u.get({ plain: true })),
      pagination: buildPagination(count, limit, page),
    });
  } catch (error) {
    console.error('Lỗi lấy users:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

const getAllGamesAdmin = async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit);
    const page = parsePage(req.query.page);
    const offset = (page - 1) * limit;
    const search = req.query.q?.trim();
    const price = req.query.price || 'all';
    const sort = req.query.sort || 'newest';

    const where = {};
    if (search) where.name = { [Op.iLike]: `%${search}%` };
    if (price === 'free') where.is_free = true;
    if (price === 'paid') where.is_free = false;

    const orderMap = {
      newest: [['id', 'DESC']],
      oldest: [['id', 'ASC']],
      name_asc: [['name', 'ASC']],
      name_desc: [['name', 'DESC']],
      price_asc: [['price_vnd', 'ASC']],
      price_desc: [['price_vnd', 'DESC']],
    };

    const { rows, count } = await Game.findAndCountAll({
      where: Object.keys(where).length ? where : undefined,
      attributes: ['id', 'name', 'header_image', 'price_vnd', 'is_free', 'steam_appid'],
      order: orderMap[sort] || orderMap.newest,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: rows.map((g) => g.get({ plain: true })),
      pagination: buildPagination(count, limit, page),
    });
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
