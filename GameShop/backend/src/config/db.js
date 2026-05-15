// src/config/db.js
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
    // Connection established
});

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL error:', err.message);
});

module.exports = pool;
