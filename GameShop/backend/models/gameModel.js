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

module.exports = {
  getAllGames,
  getGamesByGenre,
  searchGames,
  getGameById,
  getGameBySteamAppId,
  upsertGame,
  getFreeGames,
};
