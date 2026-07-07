const { Op } = require('sequelize');
const { UserLibrary, Game } = require('../orm');

const addToLibrary = async (userId, gameId, orderId, transaction) => {
  const [record] = await UserLibrary.findOrCreate({
    where: { user_id: userId, game_id: gameId },
    defaults: { order_id: orderId },
    transaction,
  });
  return record.get({ plain: true });
};

const getLibraryByUserId = async (userId) => {
  const items = await UserLibrary.findAll({
    where: { user_id: userId },
    include: [{
      model: Game,
      attributes: ['id', 'name', 'header_image', 'short_description', 'genres', 'developers', 'release_date', 'price_vnd', 'is_free'],
    }],
    order: [['acquired_at', 'DESC']],
  });

  return items.map((item) => {
    const plain = item.get({ plain: true });
    const g = plain.Game;
    return {
      id: plain.id,
      acquired_at: plain.acquired_at,
      order_id: plain.order_id,
      play_time: plain.play_time,
      last_played: plain.last_played,
      install_status: plain.install_status,
      is_favorite: plain.is_favorite,
      game_id: g.id,
      name: g.name,
      header_image: g.header_image,
      short_description: g.short_description,
      genres: g.genres,
      developers: g.developers,
      release_date: g.release_date,
      price_vnd: g.price_vnd,
      is_free: g.is_free,
    };
  });
};

const isGameOwned = async (userId, gameId) => {
  const count = await UserLibrary.count({ where: { user_id: userId, game_id: gameId } });
  return count > 0;
};

const getOwnedGameIds = async (userId, gameIds) => {
  if (!gameIds || gameIds.length === 0) return [];
  const records = await UserLibrary.findAll({
    where: { user_id: userId, game_id: { [Op.in]: gameIds } },
    attributes: ['game_id'],
  });
  return records.map((r) => r.game_id);
};

const updateInstallStatus = async (userId, gameId, installStatus) => {
  const record = await UserLibrary.findOne({ where: { user_id: userId, game_id: gameId } });
  if (!record) return null;
  await record.update({ install_status: installStatus });
  return record.get({ plain: true });
};

const updateFavoriteStatus = async (userId, gameId, isFavorite) => {
  const record = await UserLibrary.findOne({ where: { user_id: userId, game_id: gameId } });
  if (!record) return null;
  await record.update({ is_favorite: isFavorite });
  return record.get({ plain: true });
};

module.exports = {
  addToLibrary,
  getLibraryByUserId,
  isGameOwned,
  getOwnedGameIds,
  updateInstallStatus,
  updateFavoriteStatus,
};
