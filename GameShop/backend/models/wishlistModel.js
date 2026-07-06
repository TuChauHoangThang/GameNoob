const { Wishlist, Game } = require('../orm');

const getWishlistByUserId = async (userId) => {
  const items = await Wishlist.findAll({
    where: { user_id: userId },
    include: [{ model: Game }],
    order: [['added_at', 'DESC']],
  });

  return items.map((item) => {
    const plain = item.get({ plain: true });
    return { wishlist_id: plain.id, added_at: plain.added_at, ...plain.Game };
  });
};

const addToWishlist = async (userId, gameId) => {
  const [record, created] = await Wishlist.findOrCreate({
    where: { user_id: userId, game_id: gameId },
    defaults: { user_id: userId, game_id: gameId },
  });
  return created ? record.get({ plain: true }) : null;
};

const removeFromWishlist = async (userId, gameId) => {
  const record = await Wishlist.findOne({ where: { user_id: userId, game_id: gameId } });
  if (!record) return null;
  const plain = record.get({ plain: true });
  await record.destroy();
  return plain;
};

module.exports = { getWishlistByUserId, addToWishlist, removeFromWishlist };
