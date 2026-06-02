const pool = require('../configs/db');

// Tạo bảng posts nếu chưa có
const initPostsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      media_type VARCHAR(10) DEFAULT 'image',
      likes INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  // Thêm cột media_type nếu bảng đã tồn tại từ trước (migrate)
  await pool.query(`
    ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'image'
  `).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_likes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, post_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_comments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
    )
  `);
};

// Lấy danh sách bài post (kèm username, like count, comment count)
const getPosts = async (limit = 20, offset = 0, userId = null) => {
  const result = await pool.query(
    `SELECT
       p.id, p.content, p.image_url, p.media_type, p.created_at,
       u.id as user_id, u.username,
       COUNT(DISTINCT pl.id) AS like_count,
       COUNT(DISTINCT pc.id) AS comment_count,
       ${userId ? 'MAX(CASE WHEN pl2.user_id = $3 THEN 1 ELSE 0 END) = 1' : 'false'} AS liked_by_me
     FROM community_posts p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN post_likes pl ON pl.post_id = p.id
     LEFT JOIN post_comments pc ON pc.post_id = p.id
     ${userId ? 'LEFT JOIN post_likes pl2 ON pl2.post_id = p.id AND pl2.user_id = $3' : ''}
     GROUP BY p.id, u.id, u.username
     ORDER BY p.created_at DESC
     LIMIT $1 OFFSET $2`,
    userId ? [limit, offset, userId] : [limit, offset]
  );
  return result.rows;
};

// Lấy comments của một post
const getComments = async (postId) => {
  const result = await pool.query(
    `SELECT pc.id, pc.content, pc.created_at, u.id as user_id, u.username
     FROM post_comments pc
     JOIN users u ON pc.user_id = u.id
     WHERE pc.post_id = $1
     ORDER BY pc.created_at ASC`,
    [postId]
  );
  return result.rows;
};

// Tạo bài post mới
const createPost = async (userId, content, mediaUrl = null, mediaType = null) => {
  const result = await pool.query(
    `INSERT INTO community_posts (user_id, content, image_url, media_type)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, content, mediaUrl, mediaType]
  );
  return result.rows[0];
};

// Thêm comment
const addComment = async (userId, postId, content) => {
  const result = await pool.query(
    `INSERT INTO post_comments (user_id, post_id, content)
     VALUES ($1, $2, $3) RETURNING *`,
    [userId, postId, content]
  );
  return result.rows[0];
};

// Toggle like
const toggleLike = async (userId, postId) => {
  const existing = await pool.query(
    'SELECT id FROM post_likes WHERE user_id = $1 AND post_id = $2',
    [userId, postId]
  );
  if (existing.rows.length > 0) {
    await pool.query('DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);
    return { liked: false };
  } else {
    await pool.query('INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)', [userId, postId]);
    return { liked: true };
  }
};

// Xóa post (chỉ chủ sở hữu)
const deletePost = async (postId, userId) => {
  const result = await pool.query(
    'DELETE FROM community_posts WHERE id = $1 AND user_id = $2 RETURNING id',
    [postId, userId]
  );
  return result.rows[0];
};

// Sửa nội dung post (chỉ chủ sở hữu)
const updatePost = async (postId, userId, content) => {
  const result = await pool.query(
    `UPDATE community_posts
     SET content = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [content, postId, userId]
  );
  return result.rows[0];
};

// Sửa comment (chỉ chủ sở hữu)
const updateComment = async (commentId, userId, content) => {
  const result = await pool.query(
    `UPDATE post_comments
     SET content = $1
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [content, commentId, userId]
  );
  return result.rows[0];
};

// Xóa comment (chỉ chủ sở hữu)
const deleteComment = async (commentId, userId) => {
  const result = await pool.query(
    'DELETE FROM post_comments WHERE id = $1 AND user_id = $2 RETURNING id',
    [commentId, userId]
  );
  return result.rows[0];
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
