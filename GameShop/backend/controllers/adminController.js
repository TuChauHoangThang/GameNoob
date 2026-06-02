const pool = require('../configs/db');
const gameModel = require('../models/gameModel');

/**
 * Middleware xác minh quyền quản trị viên (Admin role).
 * Kiểm tra cột is_admin của tài khoản đang đăng nhập trong database.
 * @param {object} req - Express request object (userId được gán từ authMiddleware)
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
const requireAdmin = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.userId]);
    const user = result.rows[0];
    if (!user || !user.is_admin) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập trang Admin.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xác thực quyền admin.' });
  }
};

/**
 * Lấy các số liệu thống kê tổng quan cho trang Dashboard của quản trị viên.
 * Bao gồm: Tổng số user, game, đơn hàng, tổng doanh thu, top 5 bán chạy, và thống kê 7 ngày gần nhất.
 * @route GET /api/admin/stats
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getDashboardStats = async (req, res) => {
  try {
    const [users, games, orders, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM games'),
      pool.query('SELECT COUNT(*) as count FROM orders'),
      pool.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders'),
    ]);

    // Top 5 game bán chạy nhất
    const topGames = await pool.query(`
      SELECT g.id, g.name, g.header_image, g.price_vnd, g.is_free,
             COUNT(oi.id) as sold_count,
             SUM(COALESCE(oi.price_at_purchase, 0)) as revenue
      FROM games g
      JOIN order_items oi ON oi.game_id = g.id
      GROUP BY g.id, g.name, g.header_image, g.price_vnd, g.is_free
      ORDER BY sold_count DESC
      LIMIT 5
    `);

    // Doanh thu 7 ngày gần nhất
    const recentRevenue = await pool.query(`
      SELECT DATE(created_at) as date,
             COUNT(*) as orders,
             SUM(total_amount) as revenue
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Đơn hàng gần nhất
    const recentOrders = await pool.query(`
      SELECT o.id, o.total_amount, o.created_at, o.payment_method, o.card_last_four,
             u.username, u.email,
             COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id, o.total_amount, o.created_at, o.payment_method, o.card_last_four, u.username, u.email
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(users.rows[0].count),
        totalGames: parseInt(games.rows[0].count),
        totalOrders: parseInt(orders.rows[0].count),
        totalRevenue: parseFloat(revenue.rows[0].total),
      },
      topGames: topGames.rows,
      recentRevenue: recentRevenue.rows,
      recentOrders: recentOrders.rows,
    });
  } catch (error) {
    console.error('Lỗi dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * Lấy danh sách tất cả người dùng trong hệ thống (Hỗ trợ phân trang và tìm kiếm theo tên/email).
 * @route GET /api/admin/users
 * @param {object} req - Express request object (query: limit, offset, q)
 * @param {object} res - Express response object
 */
const getAllUsers = async (req, res) => {
  try {
    const limit  = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.q;

    let query = `SELECT id, username, email, is_admin, created_at FROM users`;
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      query += ` WHERE username ILIKE $1 OR email ILIKE $1`;
    }
    params.push(limit, offset);
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Lỗi lấy users:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * Lấy danh sách tất cả các game cho mục quản lý của admin (Hỗ trợ phân trang và tìm kiếm).
 * @route GET /api/admin/games
 * @param {object} req - Express request object (query: limit, offset, q)
 * @param {object} res - Express response object
 */
const getAllGamesAdmin = async (req, res) => {
  try {
    const limit  = parseInt(req.query.limit) || 30;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.q;

    let query, params;
    if (search) {
      query  = `SELECT id, name, header_image, price_vnd, is_free, steam_appid FROM games WHERE name ILIKE $1 ORDER BY id DESC LIMIT $2 OFFSET $3`;
      params = [`%${search}%`, limit, offset];
    } else {
      query  = `SELECT id, name, header_image, price_vnd, is_free, steam_appid FROM games ORDER BY id DESC LIMIT $1 OFFSET $2`;
      params = [limit, offset];
    }

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Lỗi lấy games (admin):', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * Cập nhật giá bán và trạng thái miễn phí của game.
 * @route PUT /api/admin/games/:id
 * @param {object} req - Express request object (params: id, body: price_vnd, is_free)
 * @param {object} res - Express response object
 */
const updateGamePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { price_vnd, is_free } = req.body;

    const result = await pool.query(
      `UPDATE games SET price_vnd = $1, is_free = $2 WHERE id = $3 RETURNING id, name, price_vnd, is_free`,
      [price_vnd, is_free, id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy game.' });
    }
    res.json({ success: true, message: 'Cập nhật giá thành công!', data: result.rows[0] });
  } catch (error) {
    console.error('Lỗi cập nhật game:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * Xóa game khỏi cơ sở dữ liệu dựa trên game ID.
 * @route DELETE /api/admin/games/:id
 * @param {object} req - Express request object (params: id)
 * @param {object} res - Express response object
 */
const deleteGame = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM games WHERE id = $1 RETURNING id, name', [id]);
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy game.' });
    }
    res.json({ success: true, message: `Đã xóa game "${result.rows[0].name}".` });
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
