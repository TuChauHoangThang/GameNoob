require('dotenv').config();
const { Pool } = require('pg');

async function checkDb(dbName) {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: dbName,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'games';
    `);
    if (res.rows.length > 0) {
      console.log("[SUCCESS] Games table found in " + dbName + "!");
      console.log('Columns:');
      res.rows.forEach(r => console.log(r.column_name, r.data_type));
      
      const data = await pool.query("SELECT * FROM games LIMIT 1");
      console.log('Sample:', data.rows[0]);
    } else {
      console.log("[-] No games table in " + dbName);
    }
  } catch (err) {
    console.error("[ERROR] " + dbName + ":", err.message);
  } finally {
    pool.end();
  }
}

async function run() {
  await checkDb('postgres');
  await checkDb('proassess_db');
  await checkDb('gamenoob');
}

run();
