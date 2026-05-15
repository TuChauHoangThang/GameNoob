const pool = require('../configs/db');

// Tạo đơn hàng mới
const createOrder = async (userId, totalAmount, paymentMethod, cardLastFour) => {
  const result = await pool.query(
    `INSERT INTO orders (user_id, total_amount, payment_method, card_last_four, status)
     VALUES ($1, $2, $3, $4, 'completed')
     RETURNING *`,
    [userId, totalAmount, paymentMethod, cardLastFour]
  );
  return result.rows[0];
};

// Thêm item vào đơn hàng
const addOrderItem = async (orderId, gameId, price) => {
  const result = await pool.query(
    `INSERT INTO order_items (order_id, game_id, price_at_purchase)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [orderId, gameId, price]
  );
  return result.rows[0];
};

// Lấy lịch sử đơn hàng của user
const getOrdersByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT o.*, 
            json_agg(json_build_object(
              'game_id', oi.game_id,
              'name', g.name,
              'header_image', g.header_image,
              'price', oi.price_at_purchase
            )) as items
     FROM orders o
     JOIN order_items oi ON o.id = oi.order_id
     JOIN games g ON oi.game_id = g.id
     WHERE o.user_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return result.rows;
};

// Lấy chi tiết đơn hàng
const getOrderById = async (orderId, userId) => {
  const result = await pool.query(
    `SELECT o.*, 
            json_agg(json_build_object(
              'game_id', oi.game_id,
              'name', g.name,
              'header_image', g.header_image,
              'price', oi.price_at_purchase
            )) as items
     FROM orders o
     JOIN order_items oi ON o.id = oi.order_id
     JOIN games g ON oi.game_id = g.id
     WHERE o.id = $1 AND o.user_id = $2
     GROUP BY o.id`,
    [orderId, userId]
  );
  return result.rows[0];
};

module.exports = {
  createOrder,
  addOrderItem,
  getOrdersByUserId,
  getOrderById,
};
