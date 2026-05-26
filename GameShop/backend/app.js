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
app.use('/api/games', require('./routes/gameRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/checkout', require('./routes/checkoutRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/ratings', require('./routes/ratingRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));

// Serve uploaded images
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Khởi tạo bảng ratings khi server start
const ratingModel = require('./models/ratingModel');
ratingModel.initRatingsTable()
  .then(() => console.log('Bảng user_ratings đã sẵn sàng'))
  .catch(err => console.error('Lỗi khởi tạo bảng ratings:', err));

// Khởi tạo bảng community posts
const postModel = require('./models/postModel');
postModel.initPostsTable()
  .then(() => console.log('Bảng community_posts đã sẵn sàng'))
  .catch(err => console.error('Lỗi khởi tạo bảng posts:', err));

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
