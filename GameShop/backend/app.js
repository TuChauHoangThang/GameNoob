require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./configs/db');
const { initORM } = require('./orm');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'GameNoob API is running!' });
});

// API Routes
app.use('/api/games',    require('./routes/gameRoutes'));
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/cart',     require('./routes/cartRoutes'));
app.use('/api/checkout', require('./routes/checkoutRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/ratings',  require('./routes/ratingRoutes'));
app.use('/api/reviews',  require('./routes/reviewRoutes'));
app.use('/api/posts',    require('./routes/postRoutes'));
app.use('/api/admin',    require('./routes/adminRoutes'));

// Serve uploaded images
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Khởi tạo Sequelize ORM ──────────────────────────────────────────────────
initORM()
  .then(() => console.log('✓ Sequelize ORM sẵn sàng'))
  .catch(err => console.error('✗ Sequelize ORM:', err.message));

// ── Khởi tạo bảng tự động khi server start ──────────────────────────────────
const ratingModel      = require('./models/ratingModel');
const reviewModel      = require('./models/reviewModel');
const postModel        = require('./models/postModel');
const vnpayTxnModel    = require('./models/vnpayTransactionModel');

ratingModel.initRatingsTable()
  .then(() => console.log('✓ Bảng user_ratings sẵn sàng'))
  .catch(err => console.error('✗ user_ratings:', err.message));

reviewModel.initReviewsTable()
  .then(() => console.log('✓ Bảng reviews sẵn sàng'))
  .catch(err => console.error('✗ reviews:', err.message));

postModel.initPostsTable()
  .then(() => console.log('✓ Bảng community_posts sẵn sàng'))
  .catch(err => console.error('✗ community_posts:', err.message));

vnpayTxnModel.initTable()
  .then(() => console.log('✓ Bảng vnpay_pending_orders sẵn sàng'))
  .catch(err => console.error('✗ vnpay_pending_orders:', err.message));

// ── Thêm cột is_admin và is_banned vào users nếu chưa có (migrate) ───────────
const pool = require('./configs/db');
pool.query(`
  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
`)
  .then(() => console.log('✓ Cột is_admin và is_banned trong users sẵn sàng'))
  .catch(err => console.error('✗ is_admin/is_banned migrate:', err.message));

// ── Thêm cột OTP vào users nếu chưa có (migrate) ────────────────────────────
pool.query(`
  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;
  ALTER TABLE users ALTER COLUMN otp_expires_at TYPE TIMESTAMPTZ;
`)
  .then(() => console.log('✓ Các cột OTP (is_verified, otp_code, otp_expires_at) trong users sẵn sàng'))
  .catch(err => console.error('✗ OTP migrate:', err.message));

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\nServer is running on port ${PORT}`);
});
