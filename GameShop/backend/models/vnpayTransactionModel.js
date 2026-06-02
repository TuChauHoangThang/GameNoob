const pool = require('../configs/db');

// Tạo bảng pending transactions (tự migrate)
const initTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vnpay_pending_orders (
      id SERIAL PRIMARY KEY,
      txn_ref VARCHAR(50) UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      amount BIGINT NOT NULL,
      cart_snapshot JSONB NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      vnp_transaction_no VARCHAR(50),
      bank_code VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
};

// Tạo pending order trước khi redirect sang VNPay
const createPending = async (txnRef, userId, amount, cartSnapshot) => {
  const result = await pool.query(
    `INSERT INTO vnpay_pending_orders (txn_ref, user_id, amount, cart_snapshot)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (txn_ref) DO UPDATE SET
       status = 'pending',
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [txnRef, userId, amount, JSON.stringify(cartSnapshot)]
  );
  return result.rows[0];
};

// Lấy pending order theo txnRef
const getByTxnRef = async (txnRef) => {
  const result = await pool.query(
    'SELECT * FROM vnpay_pending_orders WHERE txn_ref = $1',
    [txnRef]
  );
  return result.rows[0];
};

// Cập nhật trạng thái sau khi VNPay callback
const updateStatus = async (txnRef, status, vnpTransactionNo, bankCode) => {
  const result = await pool.query(
    `UPDATE vnpay_pending_orders
     SET status = $1, vnp_transaction_no = $2, bank_code = $3, updated_at = CURRENT_TIMESTAMP
     WHERE txn_ref = $4
     RETURNING *`,
    [status, vnpTransactionNo, bankCode, txnRef]
  );
  return result.rows[0];
};

module.exports = { initTable, createPending, getByTxnRef, updateStatus };
