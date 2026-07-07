const { Review, User } = require('../orm');
const { sequelize } = require('../orm');

const initReviewsTable = async () => {
  await Review.sync({ alter: false });
};

const getReviewsByGameId = async (gameId) => {
  const reviews = await Review.findAll({
    where: { game_id: gameId },
    include: [{ model: User, attributes: ['id', 'username'] }],
    order: [['created_at', 'DESC']],
  });
  return reviews.map((r) => {
    const plain = r.get({ plain: true });
    return {
      id: plain.id,
      rating: plain.rating,
      content: plain.content,
      created_at: plain.created_at,
      username: plain.User.username,
      user_id: plain.User.id,
    };
  });
};

const getRatingStats = async (gameId) => {
  const [stats] = await sequelize.query(
    `SELECT
       COUNT(*) as total_reviews,
       ROUND(AVG(rating)::numeric, 1) as avg_rating,
       COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive,
       COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative
     FROM reviews WHERE game_id = :gameId`,
    { replacements: { gameId }, type: sequelize.QueryTypes.SELECT }
  );
  return stats;
};

const getUserReview = async (userId, gameId) => {
  const review = await Review.findOne({ where: { user_id: userId, game_id: gameId } });
  return review ? review.get({ plain: true }) : null;
};

const createReview = async (userId, gameId, rating, content) => {
  const review = await Review.create({ user_id: userId, game_id: gameId, rating, content });
  return review.get({ plain: true });
};

const updateReview = async (reviewId, userId, rating, content) => {
  const review = await Review.findOne({ where: { id: reviewId, user_id: userId } });
  if (!review) return null;
  await review.update({ rating, content });
  return review.get({ plain: true });
};

const deleteReview = async (reviewId, userId) => {
  const review = await Review.findOne({ where: { id: reviewId, user_id: userId } });
  if (!review) return null;
  const plain = review.get({ plain: true });
  await review.destroy();
  return plain;
};

module.exports = {
  initReviewsTable,
  getReviewsByGameId,
  getRatingStats,
  getUserReview,
  createReview,
  updateReview,
  deleteReview,
};
