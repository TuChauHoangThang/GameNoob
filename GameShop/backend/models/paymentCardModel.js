const pool = require('../configs/db');

// Lưu thẻ ngân hàng (chỉ lưu thông tin cần thiết, mask số thẻ)
const saveCard = async (userId, cardType, lastFour, holderName, expiryMonth, expiryYear) => {
  const result = await pool.query(
    `INSERT INTO payment_cards (user_id, card_type, last_four, holder_name, expiry_month, expiry_year)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, last_four) DO UPDATE SET
       card_type = EXCLUDED.card_type,
       holder_name = EXCLUDED.holder_name,
       expiry_month = EXCLUDED.expiry_month,
       expiry_year = EXCLUDED.expiry_year,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [userId, cardType, lastFour, holderName, expiryMonth, expiryYear]
  );
  return result.rows[0];
};

// Lấy danh sách thẻ đã lưu của user
const getCardsByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT id, card_type, last_four, holder_name, expiry_month, expiry_year, created_at
     FROM payment_cards
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

// Xóa thẻ
const deleteCard = async (cardId, userId) => {
  const result = await pool.query(
    'DELETE FROM payment_cards WHERE id = $1 AND user_id = $2 RETURNING *',
    [cardId, userId]
  );
  return result.rows[0];
};

// Lấy thẻ theo ID
const getCardById = async (cardId, userId) => {
  const result = await pool.query(
    'SELECT * FROM payment_cards WHERE id = $1 AND user_id = $2',
    [cardId, userId]
  );
  return result.rows[0];
};

module.exports = {
  saveCard,
  getCardsByUserId,
  deleteCard,
  getCardById,
};
