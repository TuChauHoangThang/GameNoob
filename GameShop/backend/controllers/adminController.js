const { Op } = require('sequelize');
const axios = require('axios');
const { User, Game, Order, sequelize } = require('../orm');

// ── Helpers ──────────────────────────────────────────────────────────────────
const parsePage = (raw, fallback = 1) => Math.max(parseInt(raw, 10) || fallback, 1);
const parseLimit = (raw, fallback = 20, max = 50) =>
  Math.min(Math.max(parseInt(raw, 10) || fallback, 1), max);
const buildPagination = (total, limit, page) => ({
  total, limit, page,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});

// ── requireAdmin ─────────────────────────────────────────────────────────────
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

// ── getDashboardStats ─────────────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const [users, games, orders, revenue, topGames, recentRevenue, recentOrders,
      topGamesFull, userGrowth, paymentStats, topSpenders] = await Promise.all([
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

      sequelize.query(
        `SELECT TO_CHAR(created_at, 'MM/YYYY') as month,
                COUNT(*) as count
         FROM users
         WHERE created_at >= NOW() - INTERVAL '6 months'
         GROUP BY TO_CHAR(created_at, 'MM/YYYY'), DATE_TRUNC('month', created_at)
         ORDER BY DATE_TRUNC('month', created_at) ASC`,
        { type: sequelize.QueryTypes.SELECT }
      ),

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
      topGames, recentRevenue, recentOrders, topGamesFull, userGrowth, paymentStats, topSpenders,
    });
  } catch (error) {
    console.error('Lỗi dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// ── getAllUsers ───────────────────────────────────────────────────────────────
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
      attributes: ['id', 'username', 'email', 'is_admin', 'is_banned', 'created_at'],
      order: orderMap[sort] || orderMap.newest,
      limit, offset,
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

// ── deleteUser ────────────────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user.' });
    if (user.id === req.userId) return res.status(400).json({ success: false, message: 'Không thể xóa chính mình.' });
    await user.destroy();
    res.json({ success: true, message: `Đã xóa user "${user.username}".` });
  } catch (error) {
    console.error('Lỗi xóa user:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// ── updateUserRole ────────────────────────────────────────────────────────────
const updateUserRole = async (req, res) => {
  try {
    const { is_admin } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user.' });
    if (user.id === req.userId) return res.status(400).json({ success: false, message: 'Không thể thay đổi quyền của chính mình.' });
    await user.update({ is_admin });
    res.json({ success: true, message: `Đã ${is_admin ? 'cấp' : 'thu hồi'} quyền admin cho "${user.username}".` });
  } catch (error) {
    console.error('Lỗi cập nhật role:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// ── toggleBanUser ─────────────────────────────────────────────────────────────
const toggleBanUser = async (req, res) => {
  try {
    const { is_banned } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user.' });
    if (user.id === req.userId) return res.status(400).json({ success: false, message: 'Không thể khóa chính mình.' });
    await user.update({ is_banned });
    res.json({ success: true, message: `Tài khoản "${user.username}" đã được ${is_banned ? 'khóa' : 'mở khóa'}.` });
  } catch (error) {
    console.error('Lỗi ban user:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// ── getAllGamesAdmin ───────────────────────────────────────────────────────────
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
      limit, offset,
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

// ── updateGamePrice ───────────────────────────────────────────────────────────
const updateGamePrice = async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) return res.status(404).json({ success: false, message: 'Không tìm thấy game.' });
    await game.update({ price_vnd: req.body.price_vnd, is_free: req.body.is_free });
    res.json({ success: true, message: 'Cập nhật giá thành công!', data: game });
  } catch (error) {
    console.error('Lỗi cập nhật game:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// ── deleteGame ────────────────────────────────────────────────────────────────
const deleteGame = async (req, res) => {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) return res.status(404).json({ success: false, message: 'Không tìm thấy game.' });
    const name = game.name;
    await game.destroy();
    res.json({ success: true, message: `Đã xóa game "${name}".` });
  } catch (error) {
    console.error('Lỗi xóa game:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// ── addGame ───────────────────────────────────────────────────────────────────
const addGame = async (req, res) => {
  try {
    const { name, short_description, header_image, price_vnd, is_free, genres, developers, release_date } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Tên game là bắt buộc.' });
    const game = await Game.create({
      name, short_description, header_image,
      price_vnd: is_free ? 0 : (price_vnd || 0),
      is_free: !!is_free,
      genres: genres || [],
      developers: developers ? [developers] : [],
      release_date: release_date || '',
    });
    res.status(201).json({ success: true, message: `Đã thêm game "${name}".`, data: game });
  } catch (error) {
    console.error('Lỗi thêm game:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// ── importGameFromSteam ───────────────────────────────────────────────────────
const importGameFromSteam = async (req, res) => {
  const { steam_appid } = req.body;
  if (!steam_appid) return res.status(400).json({ success: false, message: 'Cần cung cấp steam_appid.' });
  try {
    const existing = await Game.findOne({ where: { steam_appid } });
    if (existing) return res.status(409).json({ success: false, message: `Game với AppID ${steam_appid} đã tồn tại.` });

    const { data } = await axios.get(
      `https://store.steampowered.com/api/appdetails?appids=${steam_appid}&cc=vn&l=en`,
      { timeout: 10000 }
    );
    const appData = data?.[steam_appid];
    if (!appData?.success) return res.status(404).json({ success: false, message: 'Không tìm thấy game trên Steam.' });

    const d = appData.data;
    const priceVnd = d.price_overview?.final || 0;
    const game = await Game.create({
      steam_appid: parseInt(steam_appid),
      name: d.name,
      short_description: d.short_description || '',
      detailed_description: d.detailed_description || '',
      header_image: d.header_image || '',
      capsule_image: d.capsule_image || '',
      website: d.website || '',
      developers: d.developers || [],
      publishers: d.publishers || [],
      price_usd: d.price_overview ? d.price_overview.final / 100 : 0,
      price_vnd: priceVnd,
      is_free: d.is_free || false,
      platforms: d.platforms || {},
      categories: d.categories || [],
      genres: d.genres || [],
      screenshots: d.screenshots?.slice(0, 5) || [],
      release_date: d.release_date?.date || '',
      metacritic_score: d.metacritic?.score || null,
      background: d.background || '',
    });
    res.status(201).json({ success: true, message: `Đã import "${d.name}" từ Steam.`, data: game });
  } catch (error) {
    console.error('Lỗi import Steam:', error.message);
    res.status(500).json({ success: false, message: 'Không thể lấy dữ liệu từ Steam. Kiểm tra lại AppID.' });
  }
};

// ── getAllOrders ──────────────────────────────────────────────────────────────
const getAllOrders = async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit);
    const page = parsePage(req.query.page);
    const offset = (page - 1) * limit;
    const search = req.query.q?.trim();
    const method = req.query.method || 'all';
    const sort = req.query.sort || 'newest';

    let whereClause = '1=1';
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (u.username ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }
    if (method !== 'all') {
      params.push(method);
      whereClause += ` AND o.payment_method = $${params.length}`;
    }

    const orderClause = sort === 'oldest' ? 'o.created_at ASC'
      : sort === 'amount_desc' ? 'o.total_amount DESC'
      : sort === 'amount_asc' ? 'o.total_amount ASC'
      : 'o.created_at DESC';

    const [orders, countResult] = await Promise.all([
      sequelize.query(
        `SELECT o.id, o.total_amount, o.created_at, o.payment_method, o.status,
                u.username, u.email, COUNT(oi.id) as item_count
         FROM orders o
         JOIN users u ON o.user_id = u.id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE ${whereClause}
         GROUP BY o.id, o.total_amount, o.created_at, o.payment_method, o.status, u.username, u.email
         ORDER BY ${orderClause}
         LIMIT ${limit} OFFSET ${offset}`,
        { bind: params, type: sequelize.QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT COUNT(DISTINCT o.id) as total
         FROM orders o JOIN users u ON o.user_id = u.id
         WHERE ${whereClause}`,
        { bind: params, type: sequelize.QueryTypes.SELECT }
      ),
    ]);

    const total = parseInt(countResult[0]?.total || 0);
    res.json({ success: true, data: orders, pagination: buildPagination(total, limit, page) });
  } catch (error) {
    console.error('Lỗi lấy orders:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// ── getVNPayOrders ────────────────────────────────────────────────────────────
const getVNPayOrders = async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit);
    const page = parsePage(req.query.page);
    const offset = (page - 1) * limit;

    const [orders, countResult] = await Promise.all([
      sequelize.query(
        `SELECT v.id, v.user_id, v.amount, v.status, v.created_at, v.txn_ref,
                u.username, u.email
         FROM vnpay_pending_orders v
         LEFT JOIN users u ON v.user_id = u.id
         ORDER BY v.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        { type: sequelize.QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT COUNT(*) as total FROM vnpay_pending_orders`,
        { type: sequelize.QueryTypes.SELECT }
      ),
    ]);

    const total = parseInt(countResult[0]?.total || 0);
    res.json({ success: true, data: orders, pagination: buildPagination(total, limit, page) });
  } catch (error) {
    console.error('Lỗi lấy VNPay orders:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// ── getAllReviews ─────────────────────────────────────────────────────────────
const getAllReviews = async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit);
    const page = parsePage(req.query.page);
    const offset = (page - 1) * limit;
    const search = req.query.q?.trim();

    let whereClause = '1=1';
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (u.username ILIKE $${params.length} OR r.content ILIKE $${params.length})`;
    }

    const [reviews, countResult] = await Promise.all([
      sequelize.query(
        `SELECT r.id, r.content, r.rating, r.created_at,
                u.username, u.email, g.name as game_name, g.id as game_id
         FROM reviews r
         LEFT JOIN users u ON r.user_id = u.id
         LEFT JOIN games g ON r.game_id = g.id
         WHERE ${whereClause}
         ORDER BY r.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        { bind: params, type: sequelize.QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT COUNT(*) as total FROM reviews r
         LEFT JOIN users u ON r.user_id = u.id
         WHERE ${whereClause}`,
        { bind: params, type: sequelize.QueryTypes.SELECT }
      ),
    ]);

    const total = parseInt(countResult[0]?.total || 0);
    res.json({ success: true, data: reviews, pagination: buildPagination(total, limit, page) });
  } catch (error) {
    console.error('Lỗi lấy reviews:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// ── deleteReview ──────────────────────────────────────────────────────────────
const deleteReview = async (req, res) => {
  try {
    const [deleted] = await sequelize.query(
      `DELETE FROM reviews WHERE id = $1 RETURNING id`,
      { bind: [req.params.id], type: sequelize.QueryTypes.DELETE }
    );
    res.json({ success: true, message: 'Đã xóa review.' });
  } catch (error) {
    console.error('Lỗi xóa review:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// ── getAllPosts ───────────────────────────────────────────────────────────────
const getAllPosts = async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit);
    const page = parsePage(req.query.page);
    const offset = (page - 1) * limit;
    const search = req.query.q?.trim();

    let whereClause = '1=1';
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (u.username ILIKE $${params.length} OR p.content ILIKE $${params.length})`;
    }

    const [posts, countResult] = await Promise.all([
      sequelize.query(
        `SELECT p.id, p.content, p.created_at,
                u.username, u.email,
                COUNT(DISTINCT pl.id) as like_count,
                COUNT(DISTINCT pc.id) as comment_count
         FROM community_posts p
         LEFT JOIN users u ON p.user_id = u.id
         LEFT JOIN post_likes pl ON pl.post_id = p.id
         LEFT JOIN post_comments pc ON pc.post_id = p.id
         WHERE ${whereClause}
         GROUP BY p.id, p.content, p.created_at, u.username, u.email
         ORDER BY p.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        { bind: params, type: sequelize.QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT COUNT(*) as total FROM community_posts p LEFT JOIN users u ON p.user_id = u.id WHERE ${whereClause}`,
        { bind: params, type: sequelize.QueryTypes.SELECT }
      ),
    ]);

    const total = parseInt(countResult[0]?.total || 0);
    res.json({ success: true, data: posts, pagination: buildPagination(total, limit, page) });
  } catch (error) {
    console.error('Lỗi lấy posts:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// ── deletePost ────────────────────────────────────────────────────────────────
const deletePost = async (req, res) => {
  try {
    await sequelize.query(`DELETE FROM community_posts WHERE id = $1`, { bind: [req.params.id] });
    res.json({ success: true, message: 'Đã xóa bài viết.' });
  } catch (error) {
    console.error('Lỗi xóa post:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// ── exportUsers CSV ───────────────────────────────────────────────────────────
const exportUsers = async (req, res) => {
  try {
    const users = await sequelize.query(
      `SELECT id, username, email, is_admin, is_banned, created_at FROM users ORDER BY created_at DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    const header = 'ID,Username,Email,Admin,Banned,Ngày tham gia\n';
    const rows = users.map(u =>
      `${u.id},"${u.username}","${u.email}",${u.is_admin},${u.is_banned || false},"${new Date(u.created_at).toLocaleString('vi-VN')}"`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="users_export.csv"');
    res.send('\uFEFF' + header + rows);
  } catch (error) {
    console.error('Lỗi export users:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// ── exportOrders CSV ──────────────────────────────────────────────────────────
const exportOrders = async (req, res) => {
  try {
    const orders = await sequelize.query(
      `SELECT o.id, u.username, u.email, o.total_amount, o.payment_method, o.status, o.created_at
       FROM orders o JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    const header = 'ID,Username,Email,Tổng tiền,Thanh toán,Trạng thái,Ngày đặt\n';
    const rows = orders.map(o =>
      `${o.id},"${o.username}","${o.email}",${o.total_amount},"${o.payment_method || ''}","${o.status || ''}","${new Date(o.created_at).toLocaleString('vi-VN')}"`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="orders_export.csv"');
    res.send('\uFEFF' + header + rows);
  } catch (error) {
    console.error('Lỗi export orders:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

module.exports = {
  requireAdmin,
  getDashboardStats,
  getAllUsers,
  deleteUser,
  updateUserRole,
  toggleBanUser,
  getAllGamesAdmin,
  updateGamePrice,
  deleteGame,
  addGame,
  importGameFromSteam,
  getAllOrders,
  getVNPayOrders,
  getAllReviews,
  deleteReview,
  getAllPosts,
  deletePost,
  exportUsers,
  exportOrders,
};
