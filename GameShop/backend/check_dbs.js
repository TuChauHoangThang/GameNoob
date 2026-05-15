const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: 'postgres' // connect to default
});

async function checkDbs() {
  try {
    const res = await pool.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
    console.log('Databases:', res.rows.map(r => r.datname));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkDbs();
