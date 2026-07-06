const { DataTypes } = require('sequelize');
const sequelize = require('../configs/sequelize');

// ── User ──────────────────────────────────────────────────────────────────────
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  is_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  otp_code: { type: DataTypes.STRING(6), allowNull: true },
  otp_expires_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

// ── Game ──────────────────────────────────────────────────────────────────────
const Game = sequelize.define('Game', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  steam_appid: { type: DataTypes.INTEGER, unique: true },
  name: { type: DataTypes.STRING(500), allowNull: false },
  short_description: { type: DataTypes.TEXT },
  detailed_description: { type: DataTypes.TEXT },
  header_image: { type: DataTypes.TEXT },
  capsule_image: { type: DataTypes.TEXT },
  website: { type: DataTypes.TEXT },
  developers: { type: DataTypes.ARRAY(DataTypes.TEXT) },
  publishers: { type: DataTypes.ARRAY(DataTypes.TEXT) },
  price_overview: { type: DataTypes.JSONB },
  price_usd: { type: DataTypes.FLOAT },
  price_vnd: { type: DataTypes.BIGINT },
  is_free: { type: DataTypes.BOOLEAN, defaultValue: false },
  platforms: { type: DataTypes.JSONB },
  categories: { type: DataTypes.JSONB },
  genres: { type: DataTypes.JSONB },
  tags: { type: DataTypes.JSONB },
  screenshots: { type: DataTypes.JSONB },
  movies: { type: DataTypes.JSONB },
  release_date: { type: DataTypes.TEXT },
  metacritic_score: { type: DataTypes.INTEGER },
  background: { type: DataTypes.TEXT },
  rating: { type: DataTypes.FLOAT, defaultValue: 0 },
  owners: { type: DataTypes.STRING(100) },
  positive_ratings: { type: DataTypes.INTEGER, defaultValue: 0 },
  negative_ratings: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'games',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// ── Cart ──────────────────────────────────────────────────────────────────────
const Cart = sequelize.define('Cart', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  game_id: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
}, {
  tableName: 'carts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [{ unique: true, fields: ['user_id', 'game_id'] }],
});

// ── Order ─────────────────────────────────────────────────────────────────────
const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  total_amount: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
  payment_method: { type: DataTypes.STRING(50) },
  card_last_four: { type: DataTypes.STRING(4) },
  status: { type: DataTypes.STRING(20), defaultValue: 'completed' },
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

// ── OrderItem ─────────────────────────────────────────────────────────────────
const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  order_id: { type: DataTypes.INTEGER, allowNull: false },
  game_id: { type: DataTypes.INTEGER, allowNull: false },
  price_at_purchase: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'order_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

// ── UserLibrary ───────────────────────────────────────────────────────────────
const UserLibrary = sequelize.define('UserLibrary', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  game_id: { type: DataTypes.INTEGER, allowNull: false },
  order_id: { type: DataTypes.INTEGER },
  play_time: { type: DataTypes.FLOAT, defaultValue: 0 },
  last_played: { type: DataTypes.DATE },
  install_status: { type: DataTypes.STRING(20), defaultValue: 'not_installed' },
  is_favorite: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'user_library',
  timestamps: true,
  createdAt: 'acquired_at',
  updatedAt: false,
  indexes: [{ unique: true, fields: ['user_id', 'game_id'] }],
});

// ── Wishlist ──────────────────────────────────────────────────────────────────
const Wishlist = sequelize.define('Wishlist', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  game_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'wishlists',
  timestamps: true,
  createdAt: 'added_at',
  updatedAt: false,
  indexes: [{ unique: true, fields: ['user_id', 'game_id'] }],
});

// ── PaymentCard ───────────────────────────────────────────────────────────────
const PaymentCard = sequelize.define('PaymentCard', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  card_type: { type: DataTypes.STRING(30) },
  last_four: { type: DataTypes.STRING(4), allowNull: false },
  holder_name: { type: DataTypes.STRING(100) },
  expiry_month: { type: DataTypes.INTEGER },
  expiry_year: { type: DataTypes.INTEGER },
}, {
  tableName: 'payment_cards',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [{ unique: true, fields: ['user_id', 'last_four'] }],
});

// ── UserRating ────────────────────────────────────────────────────────────────
const UserRating = sequelize.define('UserRating', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  game_id: { type: DataTypes.INTEGER, allowNull: false },
  is_positive: { type: DataTypes.BOOLEAN, allowNull: false },
  stars: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  comment: { type: DataTypes.TEXT },
}, {
  tableName: 'user_ratings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [{ unique: true, fields: ['user_id', 'game_id'] }],
});

// ── Review ────────────────────────────────────────────────────────────────────
const Review = sequelize.define('Review', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  game_id: { type: DataTypes.INTEGER, allowNull: false },
  rating: { type: DataTypes.SMALLINT, allowNull: false, validate: { min: 1, max: 5 } },
  content: { type: DataTypes.TEXT, allowNull: false },
}, {
  tableName: 'reviews',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [{ unique: true, fields: ['user_id', 'game_id'] }],
});

// ── CommunityPost ─────────────────────────────────────────────────────────────
const CommunityPost = sequelize.define('CommunityPost', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  image_url: { type: DataTypes.TEXT },
  media_type: { type: DataTypes.STRING(10), defaultValue: 'image' },
  likes: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'community_posts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// ── PostLike ──────────────────────────────────────────────────────────────────
const PostLike = sequelize.define('PostLike', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  post_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'post_likes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [{ unique: true, fields: ['user_id', 'post_id'] }],
});

// ── PostComment ───────────────────────────────────────────────────────────────
const PostComment = sequelize.define('PostComment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  post_id: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
}, {
  tableName: 'post_comments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

// ── VNPayPendingOrder ─────────────────────────────────────────────────────────
const VNPayPendingOrder = sequelize.define('VNPayPendingOrder', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  txn_ref: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.BIGINT, allowNull: false },
  cart_snapshot: { type: DataTypes.JSONB, allowNull: false },
  status: { type: DataTypes.STRING(20), defaultValue: 'pending' },
  vnp_transaction_no: { type: DataTypes.STRING(50) },
  bank_code: { type: DataTypes.STRING(20) },
}, {
  tableName: 'vnpay_pending_orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// ── Associations ──────────────────────────────────────────────────────────────
User.hasMany(Cart, { foreignKey: 'user_id' });
Cart.belongsTo(User, { foreignKey: 'user_id' });
Cart.belongsTo(Game, { foreignKey: 'game_id' });
Game.hasMany(Cart, { foreignKey: 'game_id' });

User.hasMany(Wishlist, { foreignKey: 'user_id' });
Wishlist.belongsTo(User, { foreignKey: 'user_id' });
Wishlist.belongsTo(Game, { foreignKey: 'game_id' });
Game.hasMany(Wishlist, { foreignKey: 'game_id' });

User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });
Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
OrderItem.belongsTo(Game, { foreignKey: 'game_id' });

User.hasMany(UserLibrary, { foreignKey: 'user_id' });
UserLibrary.belongsTo(User, { foreignKey: 'user_id' });
UserLibrary.belongsTo(Game, { foreignKey: 'game_id' });
Game.hasMany(UserLibrary, { foreignKey: 'game_id' });

User.hasMany(PaymentCard, { foreignKey: 'user_id' });
PaymentCard.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(UserRating, { foreignKey: 'user_id' });
UserRating.belongsTo(User, { foreignKey: 'user_id' });
UserRating.belongsTo(Game, { foreignKey: 'game_id' });

User.hasMany(Review, { foreignKey: 'user_id' });
Review.belongsTo(User, { foreignKey: 'user_id' });
Review.belongsTo(Game, { foreignKey: 'game_id' });

User.hasMany(CommunityPost, { foreignKey: 'user_id' });
CommunityPost.belongsTo(User, { foreignKey: 'user_id' });
CommunityPost.hasMany(PostLike, { foreignKey: 'post_id' });
CommunityPost.hasMany(PostComment, { foreignKey: 'post_id' });
PostLike.belongsTo(CommunityPost, { foreignKey: 'post_id' });
PostLike.belongsTo(User, { foreignKey: 'user_id' });
PostComment.belongsTo(CommunityPost, { foreignKey: 'post_id' });
PostComment.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(VNPayPendingOrder, { foreignKey: 'user_id' });
VNPayPendingOrder.belongsTo(User, { foreignKey: 'user_id' });

// ── Init ORM (sync schema, không alter bảng hiện có) ─────────────────────────
async function initORM() {
  await sequelize.authenticate();
  console.log('Sequelize ORM connected to PostgreSQL successfully!');
  await sequelize.sync({ alter: false });
  console.log('Sequelize ORM models synced.');
}

module.exports = {
  sequelize,
  initORM,
  User,
  Game,
  Cart,
  Order,
  OrderItem,
  UserLibrary,
  Wishlist,
  PaymentCard,
  UserRating,
  Review,
  CommunityPost,
  PostLike,
  PostComment,
  VNPayPendingOrder,
};
