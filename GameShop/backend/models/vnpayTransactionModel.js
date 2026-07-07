const { VNPayPendingOrder } = require('../orm');

const initTable = async () => {
  await VNPayPendingOrder.sync({ alter: false });
};

const createPending = async (txnRef, userId, amount, cartSnapshot) => {
  const [record] = await VNPayPendingOrder.upsert({
    txn_ref: txnRef,
    user_id: userId,
    amount,
    cart_snapshot: cartSnapshot,
    status: 'pending',
  }, { conflictFields: ['txn_ref'] });
  return record.get({ plain: true });
};

const getByTxnRef = async (txnRef) => {
  const record = await VNPayPendingOrder.findOne({ where: { txn_ref: txnRef } });
  return record ? record.get({ plain: true }) : null;
};

const updateStatus = async (txnRef, status, vnpTransactionNo, bankCode) => {
  const record = await VNPayPendingOrder.findOne({ where: { txn_ref: txnRef } });
  if (!record) return null;
  await record.update({
    status,
    vnp_transaction_no: vnpTransactionNo,
    bank_code: bankCode,
  });
  return record.get({ plain: true });
};

module.exports = { initTable, createPending, getByTxnRef, updateStatus };
