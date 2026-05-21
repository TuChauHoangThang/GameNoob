const pool = require('../configs/db');

const getWishlistByUserId = async (userId) => {
  const query = `
    SELECT w.id as wishlist_id, w.added_at, g.* 
    FROM wishlists w
    JOIN games g ON w.game_id = g.id
    WHERE w.user_id = $1
    ORDER BY w.added_at DESC
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

const addToWishlist = async (userId, gameId) => {
  const query = `
    INSERT INTO wishlists (user_id, game_id) 
    VALUES ($1, $2) 
    ON CONFLICT (user_id, game_id) DO NOTHING
    RETURNING *;
  `;
  const result = await pool.query(query, [userId, gameId]);
  return result.rows[0];
};

const removeFromWishlist = async (userId, gameId) => {
  const query = `
    DELETE FROM wishlists 
    WHERE user_id = $1 AND game_id = $2
    RETURNING *;
  `;
  const result = await pool.query(query, [userId, gameId]);
  return result.rows[0];
};

module.exports = {
  getWishlistByUserId,
  addToWishlist,
  removeFromWishlist
};
