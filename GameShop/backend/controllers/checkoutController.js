const orderModel = require('../models/orderModel');
const libraryModel = require('../models/libraryModel');
const cartModel = require('../models/cartModel');
const paymentCardModel = require('../models/paymentCardModel');
const { sequelize } = require('../orm');

async function processOrder(userId, paymentMethod, cardLastFour) {
  return sequelize.transaction(async (transaction) => {
    const cartItems = await cartModel.getCartByUserId(userId);
    if (cartItems.length === 0) throw { status: 400, message: 'Giỏ hàng trống.' };

    const gameIds = cartItems.map((i) => i.game_id);
    const ownedIds = await libraryModel.getOwnedGameIds(userId, gameIds);
    if (ownedIds.length > 0) {
      const names = cartItems.filter((i) => ownedIds.includes(i.game_id)).map((i) => i.name);
      throw { status: 400, message: `Bạn đã sở hữu: ${names.join(', ')}`, ownedGameIds: ownedIds };
    }

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + (item.is_free ? 0 : (parseInt(item.price_vnd) || 0)),
      0
    );

    const order = await orderModel.createOrder(userId, totalAmount, paymentMethod, cardLastFour || '', transaction);
    for (const item of cartItems) {
      const price = item.is_free ? 0 : (parseInt(item.price_vnd) || 0);
      await orderModel.addOrderItem(order.id, item.game_id, price, transaction);
      await libraryModel.addToLibrary(userId, item.game_id, order.id, transaction);
    }
    await cartModel.clearCart(userId, transaction);
    return { order, cartItems, totalAmount };
  });
}

function detectCardType(cardNumber) {
  if (/^4/.test(cardNumber)) return 'Visa';
  if (/^5[1-5]/.test(cardNumber)) return 'Mastercard';
  if (/^3[47]/.test(cardNumber)) return 'Amex';
  if (/^9704/.test(cardNumber)) return 'Napas';
  return 'Thẻ ngân hàng';
}

function simulatePayment() {
  return true;
}

const processCheckout = async (req, res) => {
  try {
    const userId = req.userId;
    const { cardNumber, holderName, expiryMonth, expiryYear, cvv, saveCard } = req.body;

    const cleanCardNumber = cardNumber.replace(/\s/g, '');

    const expiry = new Date(expiryYear, expiryMonth - 1);
    if (expiry < new Date()) {
      return res.status(400).json({ success: false, message: 'Thẻ đã hết hạn.' });
    }

    const cartItems = await cartModel.getCartByUserId(userId);
    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống.' });
    }

    const gameIds = cartItems.map((item) => item.game_id);
    const ownedIds = await libraryModel.getOwnedGameIds(userId, gameIds);
    if (ownedIds.length > 0) {
      const ownedNames = cartItems.filter((item) => ownedIds.includes(item.game_id)).map((item) => item.name);
      return res.status(400).json({
        success: false,
        message: `Bạn đã sở hữu game: ${ownedNames.join(', ')}. Vui lòng xóa khỏi giỏ hàng.`,
        ownedGameIds: ownedIds,
      });
    }

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + (item.is_free ? 0 : (item.price_vnd || 0) * item.quantity),
      0
    );

    const cardType = detectCardType(cleanCardNumber);
    const lastFour = cleanCardNumber.slice(-4);

    if (!simulatePayment()) {
      return res.status(400).json({ success: false, message: 'Thanh toán thất bại. Vui lòng kiểm tra lại thông tin thẻ.' });
    }

    const result = await sequelize.transaction(async (transaction) => {
      const order = await orderModel.createOrder(userId, totalAmount, cardType, lastFour, transaction);
      for (const item of cartItems) {
        const price = item.is_free ? 0 : (item.price_vnd || 0);
        await orderModel.addOrderItem(order.id, item.game_id, price, transaction);
        await libraryModel.addToLibrary(userId, item.game_id, order.id, transaction);
      }
      if (saveCard) {
        await paymentCardModel.saveCard(userId, cardType, lastFour, holderName, parseInt(expiryMonth), parseInt(expiryYear));
      }
      await cartModel.clearCart(userId, transaction);
      return order;
    });

    res.json({
      success: true,
      message: 'Thanh toán thành công! Game đã được thêm vào thư viện của bạn.',
      order: {
        id: result.id,
        totalAmount: result.total_amount,
        paymentMethod: cardType,
        cardLastFour: lastFour,
        itemCount: cartItems.length,
        createdAt: result.created_at,
      },
    });
  } catch (error) {
    console.error('Lỗi thanh toán:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi xử lý thanh toán.' });
  }
};

const checkoutWithSavedCard = async (req, res) => {
  try {
    const userId = req.userId;
    const { cardId } = req.body;

    const card = await paymentCardModel.getCardById(cardId, userId);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thẻ đã lưu.' });
    }

    const cartItems = await cartModel.getCartByUserId(userId);
    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống.' });
    }

    const gameIds = cartItems.map((item) => item.game_id);
    const ownedIds = await libraryModel.getOwnedGameIds(userId, gameIds);
    if (ownedIds.length > 0) {
      const ownedNames = cartItems.filter((item) => ownedIds.includes(item.game_id)).map((item) => item.name);
      return res.status(400).json({
        success: false,
        message: `Bạn đã sở hữu game: ${ownedNames.join(', ')}`,
        ownedGameIds: ownedIds,
      });
    }

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + (item.is_free ? 0 : (item.price_vnd || 0) * item.quantity),
      0
    );

    const order = await sequelize.transaction(async (transaction) => {
      const created = await orderModel.createOrder(userId, totalAmount, card.card_type, card.last_four, transaction);
      for (const item of cartItems) {
        const price = item.is_free ? 0 : (item.price_vnd || 0);
        await orderModel.addOrderItem(created.id, item.game_id, price, transaction);
        await libraryModel.addToLibrary(userId, item.game_id, created.id, transaction);
      }
      await cartModel.clearCart(userId, transaction);
      return created;
    });

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
  } catch (error) {
    console.error('Lỗi thanh toán:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

const getSavedCards = async (req, res) => {
  try {
    const cards = await paymentCardModel.getCardsByUserId(req.userId);
    res.json({ success: true, data: cards });
  } catch (error) {
    console.error('Lỗi lấy thẻ:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

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

const getOrderHistory = async (req, res) => {
  try {
    const orders = await orderModel.getOrdersByUserId(req.userId);
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Lỗi lấy lịch sử:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

const getLibrary = async (req, res) => {
  try {
    const library = await libraryModel.getLibraryByUserId(req.userId);
    res.json({ success: true, data: library, count: library.length });
  } catch (error) {
    console.error('Lỗi lấy thư viện:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

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

const updateInstallStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const gameId = parseInt(req.params.gameId);
    const { status } = req.body;

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

const updateFavoriteStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const gameId = parseInt(req.params.gameId);
    const { isFavorite } = req.body;

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

const checkoutWithEWallet = async (req, res) => {
  try {
    const userId = req.userId;
    const { provider } = req.body;
    const labels = { momo: 'MoMo', zalopay: 'ZaloPay' };
    const label = labels[provider];

    const { order, cartItems } = await processOrder(userId, label, null);

    return res.json({
      success: true,
      message: `Thanh toán qua ${label} thành công!`,
      order: {
        id: order.id,
        totalAmount: order.total_amount,
        paymentMethod: label,
        cardLastFour: null,
        itemCount: cartItems.length,
        createdAt: order.created_at,
      },
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message, ...err });
    console.error('Lỗi checkout ví:', err);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
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
