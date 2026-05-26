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

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
