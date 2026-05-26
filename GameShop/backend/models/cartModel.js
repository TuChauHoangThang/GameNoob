const pool = require('../configs/db');

// Lấy giỏ hàng của user (kèm thông tin game)
const getCartByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT c.id, c.quantity, c.created_at,
            g.id as game_id, g.name, g.header_image, g.price_vnd, g.is_free
     FROM carts c
     JOIN games g ON c.game_id = g.id
     WHERE c.user_id = $1
     ORDER BY c.created_at DESC`,
    [userId]
  );
  return result.rows;
};

// Thêm game vào giỏ hàng - mỗi game chỉ 1 lần
const addToCart = async (userId, gameId) => {
  // Kiểm tra đã có trong giỏ chưa
  const existing = await pool.query(
    'SELECT id FROM carts WHERE user_id = $1 AND game_id = $2',
    [userId, gameId]
  );
  if (existing.rows.length > 0) {
    return { alreadyInCart: true };
  }
  const result = await pool.query(
    `INSERT INTO carts (user_id, game_id, quantity)
     VALUES ($1, $2, 1)
     RETURNING *`,
    [userId, gameId]
  );
  return result.rows[0];
};

// Cập nhật số lượng
const updateCartQuantity = async (cartId, userId, quantity) => {
  if (quantity <= 0) {
    return removeFromCart(cartId, userId);
  }
  const result = await pool.query(
    'UPDATE carts SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [quantity, cartId, userId]
  );
  return result.rows[0];
};

// Xóa game khỏi giỏ hàng
const removeFromCart = async (cartId, userId) => {
  const result = await pool.query(
    'DELETE FROM carts WHERE id = $1 AND user_id = $2 RETURNING *',
    [cartId, userId]
  );
  return result.rows[0];
};

// Xóa toàn bộ giỏ hàng
const clearCart = async (userId) => {
  await pool.query('DELETE FROM carts WHERE user_id = $1', [userId]);
};

// Đếm số lượng item trong giỏ (mỗi game = 1 item)
const getCartCount = async (userId) => {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM carts WHERE user_id = $1',
    [userId]
  );
  return parseInt(result.rows[0].count);
};

module.exports = {
  getCartByUserId,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  getCartCount,
};
