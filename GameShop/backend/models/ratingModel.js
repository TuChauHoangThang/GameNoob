const { UserRating, User } = require('../orm');
const { sequelize } = require('../orm');

const initRatingsTable = async () => {
  await UserRating.sync({ alter: false });
};

const getUserRating = async (userId, gameId) => {
  const rating = await UserRating.findOne({
    where: { user_id: userId, game_id: gameId },
    include: [{ model: User, attributes: ['username'] }],
  });
  if (!rating) return null;
  const plain = rating.get({ plain: true });
  return { ...plain, username: plain.User.username };
};

const getRatingsByGameId = async (gameId) => {
  const ratings = await UserRating.findAll({
    where: { game_id: gameId },
    include: [{ model: User, attributes: ['username'] }],
    order: [['created_at', 'DESC']],
  });
  return ratings.map((r) => {
    const plain = r.get({ plain: true });
    return {
      id: plain.id,
      user_id: plain.user_id,
      is_positive: plain.is_positive,
      stars: plain.stars,
      comment: plain.comment,
      created_at: plain.created_at,
      username: plain.User.username,
    };
  });
};

const getRatingStats = async (gameId) => {
  const [stats] = await sequelize.query(
    `SELECT
       COUNT(*) AS total_ratings,
       SUM(CASE WHEN is_positive THEN 1 ELSE 0 END) AS positive_count,
       SUM(CASE WHEN NOT is_positive THEN 1 ELSE 0 END) AS negative_count,
       ROUND(AVG(stars)::numeric, 1) AS avg_stars
     FROM user_ratings
     WHERE game_id = :gameId`,
    { replacements: { gameId }, type: sequelize.QueryTypes.SELECT }
  );
  return stats;
};

const createRating = async (userId, gameId, isPositive, stars, comment) => {
  const rating = await UserRating.create({
    user_id: userId,
    game_id: gameId,
    is_positive: isPositive,
    stars,
    comment: comment || null,
  });
  return rating.get({ plain: true });
};

module.exports = {
  initRatingsTable,
  getUserRating,
  getRatingsByGameId,
  getRatingStats,
  createRating,
};
