require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./configs/db');

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
app.use('/api/posts',    require('./routes/postRoutes'));
app.use('/api/admin',    require('./routes/adminRoutes'));

// Serve uploaded images
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Khởi tạo bảng tự động khi server start ──────────────────────────────────
const ratingModel      = require('./models/ratingModel');
const postModel        = require('./models/postModel');
const vnpayTxnModel    = require('./models/vnpayTransactionModel');

ratingModel.initRatingsTable()
  .then(() => console.log('✓ Bảng user_ratings sẵn sàng'))
  .catch(err => console.error('✗ user_ratings:', err.message));

postModel.initPostsTable()
  .then(() => console.log('✓ Bảng community_posts sẵn sàng'))
  .catch(err => console.error('✗ community_posts:', err.message));

vnpayTxnModel.initTable()
  .then(() => console.log('✓ Bảng vnpay_pending_orders sẵn sàng'))
  .catch(err => console.error('✗ vnpay_pending_orders:', err.message));

// ── Thêm cột is_admin vào users nếu chưa có (migrate) ───────────────────────
const pool = require('./configs/db');
pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false`)
  .then(() => console.log('✓ Cột is_admin trong users sẵn sàng'))
  .catch(err => console.error('✗ is_admin migrate:', err.message));

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\nServer is running on port ${PORT}`);
});
