const { CommunityPost, PostLike, PostComment, User } = require('../orm');
const { sequelize } = require('../orm');

const initPostsTable = async () => {
  await CommunityPost.sync({ alter: false });
  await PostLike.sync({ alter: false });
  await PostComment.sync({ alter: false });
};

const getPosts = async (limit = 20, offset = 0, userId = null) => {
  const likedExpr = userId
    ? 'MAX(CASE WHEN pl2.user_id = :userId THEN 1 ELSE 0 END) = 1'
    : 'false';

  const posts = await sequelize.query(
    `SELECT
       p.id, p.content, p.image_url, p.media_type, p.created_at,
       u.id as user_id, u.username,
       COUNT(DISTINCT pl.id) AS like_count,
       COUNT(DISTINCT pc.id) AS comment_count,
       ${likedExpr} AS liked_by_me
     FROM community_posts p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN post_likes pl ON pl.post_id = p.id
     LEFT JOIN post_comments pc ON pc.post_id = p.id
     ${userId ? 'LEFT JOIN post_likes pl2 ON pl2.post_id = p.id AND pl2.user_id = :userId' : ''}
     GROUP BY p.id, u.id, u.username
     ORDER BY p.created_at DESC
     LIMIT :limit OFFSET :offset`,
    {
      replacements: userId ? { limit, offset, userId } : { limit, offset },
      type: sequelize.QueryTypes.SELECT,
    }
  );
  return posts;
};

const getComments = async (postId) => {
  const comments = await PostComment.findAll({
    where: { post_id: postId },
    include: [{ model: User, attributes: ['id', 'username'] }],
    order: [['created_at', 'ASC']],
  });
  return comments.map((c) => {
    const plain = c.get({ plain: true });
    return {
      id: plain.id,
      content: plain.content,
      created_at: plain.created_at,
      user_id: plain.User.id,
      username: plain.User.username,
    };
  });
};

const createPost = async (userId, content, mediaUrl = null, mediaType = null) => {
  const post = await CommunityPost.create({
    user_id: userId,
    content,
    image_url: mediaUrl,
    media_type: mediaType,
  });
  return post.get({ plain: true });
};

const addComment = async (userId, postId, content) => {
  const comment = await PostComment.create({ user_id: userId, post_id: postId, content });
  return comment.get({ plain: true });
};

const toggleLike = async (userId, postId) => {
  const existing = await PostLike.findOne({ where: { user_id: userId, post_id: postId } });
  if (existing) {
    await existing.destroy();
    return { liked: false };
  }
  await PostLike.create({ user_id: userId, post_id: postId });
  return { liked: true };
};

const deletePost = async (postId, userId) => {
  const post = await CommunityPost.findOne({ where: { id: postId, user_id: userId } });
  if (!post) return null;
  const plain = { id: post.id };
  await post.destroy();
  return plain;
};

const updatePost = async (postId, userId, content) => {
  const post = await CommunityPost.findOne({ where: { id: postId, user_id: userId } });
  if (!post) return null;
  await post.update({ content });
  return post.get({ plain: true });
};

const updateComment = async (commentId, userId, content) => {
  const comment = await PostComment.findOne({ where: { id: commentId, user_id: userId } });
  if (!comment) return null;
  await comment.update({ content });
  return comment.get({ plain: true });
};

const deleteComment = async (commentId, userId) => {
  const comment = await PostComment.findOne({ where: { id: commentId, user_id: userId } });
  if (!comment) return null;
  const plain = { id: comment.id };
  await comment.destroy();
  return plain;
};

module.exports = {
  initPostsTable,
  getPosts,
  getComments,
  createPost,
  addComment,
  toggleLike,
  deletePost,
  updatePost,
  updateComment,
  deleteComment,
};
