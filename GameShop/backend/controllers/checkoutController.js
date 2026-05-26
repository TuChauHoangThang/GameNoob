const orderModel = require('../models/orderModel');
const libraryModel = require('../models/libraryModel');
const cartModel = require('../models/cartModel');
const paymentCardModel = require('../models/paymentCardModel');
const pool = require('../configs/db');

// Xử lý thanh toán
const processCheckout = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.userId;
    const { cardNumber, holderName, expiryMonth, expiryYear, cvv, saveCard } = req.body;

    // Validate thông tin thẻ
    if (!cardNumber || !holderName || !expiryMonth || !expiryYear || !cvv) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin thẻ ngân hàng.' });
    }

    // Validate số thẻ (16 chữ số)
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (!/^\d{16}$/.test(cleanCardNumber)) {
      return res.status(400).json({ success: false, message: 'Số thẻ không hợp lệ. Vui lòng nhập 16 chữ số.' });
    }

    // Validate CVV (3-4 chữ số)
    if (!/^\d{3,4}$/.test(cvv)) {
      return res.status(400).json({ success: false, message: 'Mã CVV không hợp lệ.' });
    }

    // Validate ngày hết hạn
    const now = new Date();
    const expiry = new Date(expiryYear, expiryMonth - 1);
    if (expiry < now) {
      return res.status(400).json({ success: false, message: 'Thẻ đã hết hạn.' });
    }

    // Lấy giỏ hàng
    const cartItems = await cartModel.getCartByUserId(userId);
    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống.' });
    }

    // Kiểm tra xem có game nào đã sở hữu rồi không
    const gameIds = cartItems.map(item => item.game_id);
    const ownedIds = await libraryModel.getOwnedGameIds(userId, gameIds);
    if (ownedIds.length > 0) {
      const ownedNames = cartItems
        .filter(item => ownedIds.includes(item.game_id))
        .map(item => item.name);
      return res.status(400).json({
        success: false,
        message: `Bạn đã sở hữu game: ${ownedNames.join(', ')}. Vui lòng xóa khỏi giỏ hàng.`,
        ownedGameIds: ownedIds,
      });
    }

    // Tính tổng tiền
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + (item.is_free ? 0 : (item.price_vnd || 0) * item.quantity);
    }, 0);

    // Xác định loại thẻ từ số thẻ
    const cardType = detectCardType(cleanCardNumber);
    const lastFour = cleanCardNumber.slice(-4);

    // Bắt đầu transaction
    await client.query('BEGIN');

    try {
      // *** Mô phỏng xử lý thanh toán ***
      // Trong thực tế, đây là nơi gọi API payment gateway (VNPay, Momo, Stripe, etc.)
      // Hiện tại mô phỏng thanh toán thành công
      const paymentSuccess = simulatePayment(cleanCardNumber, totalAmount);
      if (!paymentSuccess) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Thanh toán thất bại. Vui lòng kiểm tra lại thông tin thẻ.' });
      }

      // Tạo đơn hàng
      const order = await orderModel.createOrder(userId, totalAmount, cardType, lastFour);

      // Thêm từng game vào order_items và user_library
      for (const item of cartItems) {
        const price = item.is_free ? 0 : (item.price_vnd || 0);
        await orderModel.addOrderItem(order.id, item.game_id, price);
        await libraryModel.addToLibrary(userId, item.game_id, order.id);
      }

      // Lưu thẻ nếu user chọn
      if (saveCard) {
        await paymentCardModel.saveCard(userId, cardType, lastFour, holderName, parseInt(expiryMonth), parseInt(expiryYear));
      }

      // Xóa giỏ hàng
      await cartModel.clearCart(userId);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Thanh toán thành công! Game đã được thêm vào thư viện của bạn.',
        order: {
          id: order.id,
          totalAmount: order.total_amount,
          paymentMethod: cardType,
          cardLastFour: lastFour,
          itemCount: cartItems.length,
          createdAt: order.created_at,
        },
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    }
  } catch (error) {
    console.error('Lỗi thanh toán:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi xử lý thanh toán.' });
  } finally {
    client.release();
  }
};

// Thanh toán bằng thẻ đã lưu
const checkoutWithSavedCard = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.userId;
    const { cardId, cvv } = req.body;

    if (!cardId || !cvv) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn thẻ và nhập mã CVV.' });
    }

    // Lấy thông tin thẻ đã lưu
    const card = await paymentCardModel.getCardById(cardId, userId);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thẻ đã lưu.' });
    }

    // Lấy giỏ hàng
    const cartItems = await cartModel.getCartByUserId(userId);
    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống.' });
    }

    // Kiểm tra game đã sở hữu
    const gameIds = cartItems.map(item => item.game_id);
    const ownedIds = await libraryModel.getOwnedGameIds(userId, gameIds);
    if (ownedIds.length > 0) {
      const ownedNames = cartItems
        .filter(item => ownedIds.includes(item.game_id))
        .map(item => item.name);
      return res.status(400).json({
        success: false,
        message: `Bạn đã sở hữu game: ${ownedNames.join(', ')}`,
        ownedGameIds: ownedIds,
      });
    }

    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + (item.is_free ? 0 : (item.price_vnd || 0) * item.quantity);
    }, 0);

    await client.query('BEGIN');

    try {
      const order = await orderModel.createOrder(userId, totalAmount, card.card_type, card.last_four);

      for (const item of cartItems) {
        const price = item.is_free ? 0 : (item.price_vnd || 0);
        await orderModel.addOrderItem(order.id, item.game_id, price);
        await libraryModel.addToLibrary(userId, item.game_id, order.id);
      }

      await cartModel.clearCart(userId);
      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Thanh toán thành công!',
        order: {
          id: order.id,
          totalAmount: order.total_amount,
          paymentMethod: card.card_type,
          cardLastFour: card.last_four,
          itemCount: cartItems.length,
          createdAt: order.created_at,
        },
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    }
  } catch (error) {
    console.error('Lỗi thanh toán:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  } finally {
    client.release();
  }
};

// Lấy thẻ đã lưu
const getSavedCards = async (req, res) => {
  try {
    const cards = await paymentCardModel.getCardsByUserId(req.userId);
    res.json({ success: true, data: cards });
  } catch (error) {
    console.error('Lỗi lấy thẻ:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// Xóa thẻ đã lưu
const deleteSavedCard = async (req, res) => {
  try {
    const deleted = await paymentCardModel.deleteCard(req.params.id, req.userId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thẻ.' });
    }
    res.json({ success: true, message: 'Đã xóa thẻ.' });
  } catch (error) {
    console.error('Lỗi xóa thẻ:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// Lấy lịch sử đơn hàng
const getOrderHistory = async (req, res) => {
  try {
    const orders = await orderModel.getOrdersByUserId(req.userId);
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Lỗi lấy lịch sử:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// Lấy thư viện game
const getLibrary = async (req, res) => {
  try {
    const library = await libraryModel.getLibraryByUserId(req.userId);
    res.json({ success: true, data: library, count: library.length });
  } catch (error) {
    console.error('Lỗi lấy thư viện:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// Kiểm tra game đã sở hữu
const checkOwnership = async (req, res) => {
  try {
    const { gameIds } = req.body;
    const ownedIds = await libraryModel.getOwnedGameIds(req.userId, gameIds);
    res.json({ success: true, ownedGameIds: ownedIds });
  } catch (error) {
    console.error('Lỗi kiểm tra:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// === Helper Functions ===

// Xác định loại thẻ từ số thẻ
function detectCardType(cardNumber) {
  if (/^4/.test(cardNumber)) return 'Visa';
  if (/^5[1-5]/.test(cardNumber)) return 'Mastercard';
  if (/^3[47]/.test(cardNumber)) return 'Amex';
  if (/^6(?:011|5)/.test(cardNumber)) return 'Discover';
  if (/^9704/.test(cardNumber)) return 'Napas'; // Thẻ nội địa Việt Nam
  return 'Thẻ ngân hàng';
}

// Mô phỏng thanh toán (trong thực tế sẽ gọi payment gateway)
function simulatePayment(cardNumber, amount) {
  // Mô phỏng: tất cả thanh toán đều thành công
  // Trong production, đây sẽ là nơi tích hợp VNPay, Momo, ZaloPay, etc.
  return true;
}

// Cập nhật trạng thái cài đặt
const updateInstallStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const gameId = parseInt(req.params.gameId);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Trạng thái cài đặt là bắt buộc.' });
    }

    const updated = await libraryModel.updateInstallStatus(userId, gameId, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Trò chơi không tìm thấy trong thư viện của bạn.' });
    }

    res.json({ success: true, message: 'Cập nhật trạng thái cài đặt thành công.', data: updated });
  } catch (error) {
    console.error('Lỗi cập nhật cài đặt:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái cài đặt.' });
  }
};

// Cập nhật trạng thái yêu thích
const updateFavoriteStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const gameId = parseInt(req.params.gameId);
    const { isFavorite } = req.body;

    if (isFavorite === undefined) {
      return res.status(400).json({ success: false, message: 'Trạng thái yêu thích là bắt buộc.' });
    }

    const updated = await libraryModel.updateFavoriteStatus(userId, gameId, isFavorite);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Trò chơi không tìm thấy trong thư viện của bạn.' });
    }

    res.json({ success: true, message: 'Cập nhật trạng thái yêu thích thành công.', data: updated });
  } catch (error) {
    console.error('Lỗi cập nhật yêu thích:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái yêu thích.' });
  }
};

module.exports = {
  processCheckout,
  checkoutWithSavedCard,
  getSavedCards,
  deleteSavedCard,
  getOrderHistory,
  getLibrary,
  checkOwnership,
  updateInstallStatus,
  updateFavoriteStatus,
};
