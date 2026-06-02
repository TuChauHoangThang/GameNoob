const orderModel = require('../models/orderModel');
const libraryModel = require('../models/libraryModel');
const cartModel = require('../models/cartModel');
const paymentCardModel = require('../models/paymentCardModel');
const pool = require('../configs/db');

/**
 * Helper dùng chung xử lý giao dịch đơn hàng.
 * Thực hiện: validate giỏ hàng, trừ tiền, tạo order, thêm vào library, và dọn sạch giỏ hàng.
 * @param {object} client - Connection client từ pool kết nối DB (dành cho Transaction)
 * @param {number} userId - ID người dùng thực hiện checkout
 * @param {string} paymentMethod - Phương thức thanh toán (Visa, Napas, MoMo...)
 * @param {string|null} cardLastFour - 4 số cuối của thẻ ngân hàng sử dụng
 * @returns {Promise<object>} Đối tượng chứa thông tin order, cartItems và totalAmount
 */
async function processOrder(client, userId, paymentMethod, cardLastFour) {
  const cartItems = await cartModel.getCartByUserId(userId);
  if (cartItems.length === 0) throw { status: 400, message: 'Giỏ hàng trống.' };

  const gameIds = cartItems.map(i => i.game_id);
  const ownedIds = await libraryModel.getOwnedGameIds(userId, gameIds);
  if (ownedIds.length > 0) {
    const names = cartItems.filter(i => ownedIds.includes(i.game_id)).map(i => i.name);
    throw { status: 400, message: `Bạn đã sở hữu: ${names.join(', ')}`, ownedGameIds: ownedIds };
  }

  const totalAmount = cartItems.reduce((sum, item) =>
    sum + (item.is_free ? 0 : (parseInt(item.price_vnd) || 0)), 0);

  await client.query('BEGIN');
  try {
    const order = await orderModel.createOrder(userId, totalAmount, paymentMethod, cardLastFour || '');
    for (const item of cartItems) {
      const price = item.is_free ? 0 : (parseInt(item.price_vnd) || 0);
      await orderModel.addOrderItem(order.id, item.game_id, price);
      await libraryModel.addToLibrary(userId, item.game_id, order.id);
    }
    await cartModel.clearCart(userId);
    await client.query('COMMIT');
    return { order, cartItems, totalAmount };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

/**
 * Thanh toán giỏ hàng bằng thẻ ngân hàng mới (Visa / Mastercard / Napas).
 * @route POST /api/checkout/process
 * @param {object} req - Express request object (body: cardNumber, holderName, expiryMonth, expiryYear, cvv, saveCard)
 * @param {object} res - Express response object
 */
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
      // Mô phỏng xử lý thanh toán
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

/**
 * Thanh toán nhanh bằng thẻ đã lưu từ trước.
 * @route POST /api/checkout/saved-card
 * @param {object} req - Express request object (body: cardId, cvv)
 * @param {object} res - Express response object
 */
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

/**
 * Lấy toàn bộ danh sách thẻ ngân hàng đã lưu của người dùng hiện tại.
 * @route GET /api/checkout/saved-cards
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getSavedCards = async (req, res) => {
  try {
    const cards = await paymentCardModel.getCardsByUserId(req.userId);
    res.json({ success: true, data: cards });
  } catch (error) {
    console.error('Lỗi lấy thẻ:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * Xóa một thẻ ngân hàng đã lưu.
 * @route DELETE /api/checkout/saved-cards/:id
 * @param {object} req - Express request object (params: id)
 * @param {object} res - Express response object
 */
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

/**
 * Lấy lịch sử tất cả các đơn hàng đã mua của người dùng hiện tại.
 * @route GET /api/checkout/orders
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getOrderHistory = async (req, res) => {
  try {
    const orders = await orderModel.getOrdersByUserId(req.userId);
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Lỗi lấy lịch sử:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * Lấy danh sách toàn bộ các game đã sở hữu trong thư viện người dùng.
 * @route GET /api/checkout/library
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getLibrary = async (req, res) => {
  try {
    const library = await libraryModel.getLibraryByUserId(req.userId);
    res.json({ success: true, data: library, count: library.length });
  } catch (error) {
    console.error('Lỗi lấy thư viện:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * Kiểm tra quyền sở hữu đối với một tập hợp các game ID cụ thể.
 * @route POST /api/checkout/check-ownership
 * @param {object} req - Express request object (body: gameIds)
 * @param {object} res - Express response object
 */
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

/**
 * Xác định loại thẻ tín dụng / nội địa từ số thẻ ngân hàng.
 * @param {string} cardNumber - Số thẻ ngân hàng đã chuẩn hóa
 * @returns {string} Tên loại thẻ (Visa, Mastercard, Amex, Napas...)
 */
function detectCardType(cardNumber) {
  if (/^4/.test(cardNumber)) return 'Visa';
  if (/^5[1-5]/.test(cardNumber)) return 'Mastercard';
  if (/^3[47]/.test(cardNumber)) return 'Amex';
  if (/^6(?:011|5)/.test(cardNumber)) return 'Discover';
  if (/^9704/.test(cardNumber)) return 'Napas'; // Thẻ nội địa Việt Nam
  return 'Thẻ ngân hàng';
}

/**
 * Mô phỏng quá trình giao dịch thanh toán ngân hàng (sandbox).
 * @param {string} cardNumber - Số thẻ ngân hàng
 * @param {number} amount - Số tiền giao dịch
 * @returns {boolean} Luôn trả về true (giả lập thanh toán thành công)
 */
function simulatePayment(cardNumber, amount) {
  return true;
}

/**
 * Cập nhật trạng thái cài đặt của game trong thư viện cá nhân (ví dụ: installed, uninstalled).
 * @route PUT /api/checkout/library/:gameId/install
 * @param {object} req - Express request object (params: gameId, body: status)
 * @param {object} res - Express response object
 */
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

/**
 * Đổi trạng thái yêu thích (Favorite) của game trong thư viện cá nhân.
 * @route PUT /api/checkout/library/:gameId/favorite
 * @param {object} req - Express request object (params: gameId, body: isFavorite)
 * @param {object} res - Express response object
 */
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

/**
 * Thanh toán qua ví điện tử nội địa (MoMo / ZaloPay giả lập).
 * @route POST /api/checkout/ewallet
 * @param {object} req - Express request object (body: provider, confirmCode)
 * @param {object} res - Express response object
 */
const checkoutWithEWallet = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.userId;
    const { provider, confirmCode } = req.body;
    const SUPPORTED = ['momo', 'zalopay'];
    if (!SUPPORTED.includes(provider))
      return res.status(400).json({ success: false, message: 'Cổng thanh toán không hỗ trợ.' });
    if (!confirmCode || confirmCode.trim().length < 4)
      return res.status(400).json({ success: false, message: 'Mã xác nhận không hợp lệ.' });

    const labels = { momo: 'MoMo', zalopay: 'ZaloPay' };
    const label = labels[provider];

    const { order, cartItems } = await processOrder(client, userId, label, null);

    return res.json({
      success: true,
      message: `Thanh toán qua ${label} thành công!`,
      order: { id: order.id, totalAmount: order.total_amount, paymentMethod: label, cardLastFour: null, itemCount: cartItems.length, createdAt: order.created_at },
    });
  } catch (err) {
    if (!client._ending) client.query('ROLLBACK').catch(() => {});
    if (err.status) return res.status(err.status).json({ success: false, message: err.message, ...err });
    console.error('Lỗi checkout ví:', err);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  } finally { client.release(); }
};

module.exports = {
  processCheckout,
  checkoutWithSavedCard,
  checkoutWithEWallet,
  getSavedCards,
  deleteSavedCard,
  getOrderHistory,
  getLibrary,
  checkOwnership,
  updateInstallStatus,
  updateFavoriteStatus,
};
