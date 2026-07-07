const { Op } = require('sequelize');
const { Game, sequelize } = require('../orm');

const getAllGames = async (limit = 20, offset = 0) => {
  const games = await Game.findAll({
    order: [['id', 'DESC']],
    limit,
    offset,
  });
  return games.map((g) => g.get({ plain: true }));
};

const getGamesByGenre = async (genre, limit = 20, offset = 0) => {
  const pattern = `%${genre}%`;
  const games = await Game.findAll({
    where: {
      [Op.or]: [
        sequelize.where(sequelize.cast(sequelize.col('genres'), 'TEXT'), { [Op.iLike]: pattern }),
        sequelize.where(sequelize.cast(sequelize.col('categories'), 'TEXT'), { [Op.iLike]: pattern }),
      ],
    },
    order: [['id', 'DESC']],
    limit,
    offset,
  });
  return games.map((g) => g.get({ plain: true }));
};

const searchGames = async (query, limit = 20, offset = 0) => {
  const games = await Game.findAll({
    where: { name: { [Op.iLike]: `%${query}%` } },
    order: [['id', 'DESC']],
    limit,
    offset,
  });
  return games.map((g) => g.get({ plain: true }));
};

const getGameById = async (id) => {
  const game = await Game.findByPk(id);
  return game ? game.get({ plain: true }) : null;
};

const getGameBySteamAppId = async (steamAppId) => {
  const game = await Game.findOne({ where: { steam_appid: steamAppId } });
  return game ? game.get({ plain: true }) : null;
};

const upsertGame = async (gameData) => {
  const {
    steam_appid, name, short_description, detailed_description,
    header_image, capsule_image, website, developers, publishers,
    price_overview, platforms, categories, genres, screenshots,
    movies, release_date, background, rating, owners,
  } = gameData;

  const [game] = await Game.upsert({
    steam_appid,
    name,
    short_description,
    detailed_description,
    header_image,
    capsule_image,
    website,
    developers,
    publishers,
    price_overview,
    platforms,
    categories,
    genres,
    screenshots,
    movies,
    release_date,
    background,
    rating,
    owners,
  }, { conflictFields: ['steam_appid'] });

  return game.get({ plain: true });
};

const getFreeGames = async (limit = 20, offset = 0) => {
  const games = await Game.findAll({
    where: { is_free: true },
    order: [['id', 'DESC']],
    limit,
    offset,
  });
  return games.map((g) => g.get({ plain: true }));
};

const getGamesByTag = async (tag, limit = 20, offset = 0) => {
  if (tag === 'new') {
    const games = await Game.findAll({
      order: [['id', 'DESC']],
      limit,
      offset,
    });
    return games.map((g) => g.get({ plain: true }));
  } else if (tag === 'top') {
    const results = await sequelize.query(`
      SELECT g.*, COUNT(oi.id) as sold_count
      FROM games g
      LEFT JOIN order_items oi ON oi.game_id = g.id
      GROUP BY g.id
      ORDER BY sold_count DESC, g.positive_ratings DESC, g.id DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { limit, offset },
      type: sequelize.QueryTypes.SELECT
    });
    return results;
  } else if (tag === 'sale') {
    const results = await sequelize.query(`
      SELECT * FROM games
      WHERE price_vnd > 0 AND (id % 3) = 0
      ORDER BY id DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { limit, offset },
      type: sequelize.QueryTypes.SELECT
    });
    return results;
  } else if (tag === 'free') {
    return getFreeGames(limit, offset);
  }
  return getAllGames(limit, offset);
};

module.exports = {
  getAllGames,
  getGamesByGenre,
  searchGames,
  getGameById,
  getGameBySteamAppId,
  upsertGame,
  getFreeGames,
  getGamesByTag,
};
