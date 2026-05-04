require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'GameNoob API is running!' });
});

// API Routes
app.use('/api/games', require('./src/routes/gameRoutes'));

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
