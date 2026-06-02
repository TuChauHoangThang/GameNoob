const { createPaymentUrl, verifyReturnUrl } = require('../utils/vnpay');
const vnpayTxnModel = require('../models/vnpayTransactionModel');
const cartModel = require('../models/cartModel');
const orderModel = require('../models/orderModel');
const libraryModel = require('../models/libraryModel');
const pool = require('../configs/db');

/**
 * BƯỚC 1 — Tạo URL thanh toán VNPay
 * POST /api/checkout/vnpay/create
 */
exports.createVNPayUrl = async (req, res) => {
  try {
    const userId = req.user.id;

    // Lấy giỏ hàng hiện tại
    const cartItems = await cartModel.getCartByUserId(userId);
    if (cartItems.length === 0)
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống.' });

    // Kiểm tra đã sở hữu chưa
    const gameIds = cartItems.map(i => i.game_id);
    const ownedIds = await libraryModel.getOwnedGameIds(userId, gameIds);
    if (ownedIds.length > 0) {
      const names = cartItems.filter(i => ownedIds.includes(i.game_id)).map(i => i.name);
      return res.status(400).json({ success: false, message: `Bạn đã sở hữu: ${names.join(', ')}`, ownedGameIds: ownedIds });
    }

    // Tính tổng tiền
    const totalAmount = cartItems.reduce((sum, item) =>
      sum + (item.is_free ? 0 : (parseInt(item.price_vnd) || 0)), 0);

    // Tạo mã giao dịch duy nhất: userId + timestamp
    const txnRef = `${userId}${Date.now()}`;

    // Lấy IP client
    const ipAddr = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';

    // Lưu pending order (snapshot giỏ hàng để xử lý sau khi VNPay callback)
    await vnpayTxnModel.createPending(txnRef, userId, totalAmount, cartItems);

    // Tạo URL thanh toán
    const paymentUrl = createPaymentUrl({
      orderId: txnRef,
      amount: totalAmount,
      orderInfo: `GameNoob - Thanh toan don hang ${txnRef}`,
      ipAddr,
      locale: 'vn',
    });

    res.json({ success: true, paymentUrl, txnRef });
  } catch (err) {
    console.error('Lỗi tạo VNPay URL:', err);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * BƯỚC 2a — Return URL (VNPay redirect trình duyệt về đây sau khi thanh toán)
 * GET /api/checkout/vnpay/return
 * → Tự fulfill nếu chưa xử lý, rồi redirect frontend
 */
exports.vnpayReturn = async (req, res) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const result = verifyReturnUrl(req.query);

    if (!result.isValid) {
      return res.redirect(`${frontendUrl}/checkout/result?status=invalid&message=${encodeURIComponent('Chữ ký không hợp lệ')}`);
    }

    const txnRef = result.txnRef;
    const pending = await vnpayTxnModel.getByTxnRef(txnRef);

    if (!pending) {
      return res.redirect(`${frontendUrl}/checkout/result?status=error&message=${encodeURIComponent('Không tìm thấy đơn hàng')}`);
    }

    if (result.rspCode === '00') {
      // Thanh toán thành công — fulfill ngay tại đây nếu chưa xử lý
      // (không chờ IPN vì IPN cần URL public, còn Return URL là browser redirect)
      if (pending.status === 'pending') {
        try {
          await fulfillOrder(pending, result.bankCode, result.bankTranNo);
        } catch (e) {
          console.error('fulfillOrder error (return):', e.message);
          // Nếu lỗi fulfill (ví dụ đã xử lý rồi) — bỏ qua
        }
      }
      return res.redirect(
        `${frontendUrl}/checkout/result?status=success&txnRef=${encodeURIComponent(txnRef)}&amount=${result.amount}&bank=${encodeURIComponent(result.bankCode || '')}&message=${encodeURIComponent(result.message)}`
      );
    } else {
      await vnpayTxnModel.updateStatus(txnRef, 'failed', null, null);
      return res.redirect(
        `${frontendUrl}/checkout/result?status=failed&code=${result.rspCode}&message=${encodeURIComponent(result.message)}`
      );
    }
  } catch (err) {
    console.error('Lỗi VNPay return:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/checkout/result?status=error&message=${encodeURIComponent('Lỗi server')}`);
  }
};

/**
 * BƯỚC 2b — IPN URL (VNPay gọi server-to-server để xác nhận)
 * GET /api/checkout/vnpay/ipn
 * → Phải trả về { RspCode: '00', Message: 'Confirm Success' }
 */
exports.vnpayIPN = async (req, res) => {
  try {
    const result = verifyReturnUrl(req.query);

    if (!result.isValid) {
      return res.json({ RspCode: '97', Message: 'Invalid Checksum' });
    }

    const txnRef = result.txnRef;
    const pending = await vnpayTxnModel.getByTxnRef(txnRef);

    if (!pending) {
      return res.json({ RspCode: '01', Message: 'Order not found' });
    }

    // Kiểm tra số tiền khớp
    if (parseInt(pending.amount) !== parseInt(result.amount)) {
      return res.json({ RspCode: '04', Message: 'Invalid amount' });
    }

    if (pending.status !== 'pending') {
      // Đã xử lý rồi
      return res.json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    if (result.rspCode === '00') {
      try {
        await fulfillOrder(pending, result.bankCode, result.bankTranNo);
        return res.json({ RspCode: '00', Message: 'Confirm Success' });
      } catch (e) {
        console.error('fulfillOrder IPN error:', e);
        return res.json({ RspCode: '99', Message: 'Internal error' });
      }
    } else {
      await vnpayTxnModel.updateStatus(txnRef, 'failed', null, null);
      return res.json({ RspCode: '00', Message: 'Confirm Success' });
    }
  } catch (err) {
    console.error('VNPay IPN error:', err);
    res.json({ RspCode: '99', Message: 'Internal error' });
  }
};

/**
 * BƯỚC 3 — Poll trạng thái đơn hàng (FE gọi sau khi return)
 * GET /api/checkout/vnpay/status/:txnRef
 */
exports.getVNPayStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { txnRef } = req.params;
    const pending = await vnpayTxnModel.getByTxnRef(txnRef);

    if (!pending || pending.user_id !== userId)
      return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch.' });

    res.json({
      success: true,
      status: pending.status,
      amount: pending.amount,
      bankCode: pending.bank_code,
      txnRef,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// ── Fulfill order: tạo order, thêm vào library, xóa cart ─────────────────────
async function fulfillOrder(pending, bankCode, vnpTransactionNo) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cartItems = pending.cart_snapshot;
    const userId    = pending.user_id;

    const order = await orderModel.createOrder(userId, pending.amount, `VNPay (${bankCode || 'N/A'})`, null);

    for (const item of cartItems) {
      const price = item.is_free ? 0 : (parseInt(item.price_vnd) || 0);
      await orderModel.addOrderItem(order.id, item.game_id, price);
      await libraryModel.addToLibrary(userId, item.game_id, order.id);
    }

    await cartModel.clearCart(userId);
    await client.query('COMMIT');

    // Cập nhật trạng thái pending record
    await vnpayTxnModel.updateStatus(pending.txn_ref, 'completed', vnpTransactionNo, bankCode);

    return order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
