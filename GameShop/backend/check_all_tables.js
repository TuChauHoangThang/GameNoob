const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkAllTables() {
  try {
    const res = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
    `);
    console.log('Tables found in ' + process.env.DB_NAME + ':');
    res.rows.forEach(r => console.log(` - ${r.table_schema}.${r.table_name}`));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkAllTables();
