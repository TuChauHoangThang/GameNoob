const { Order, OrderItem, Game } = require('../orm');
const { sequelize } = require('../orm');

const createOrder = async (userId, totalAmount, paymentMethod, cardLastFour, transaction) => {
  const order = await Order.create({
    user_id: userId,
    total_amount: totalAmount,
    payment_method: paymentMethod,
    card_last_four: cardLastFour,
    status: 'completed',
  }, { transaction });
  return order.get({ plain: true });
};

const addOrderItem = async (orderId, gameId, price, transaction) => {
  const item = await OrderItem.create({
    order_id: orderId,
    game_id: gameId,
    price_at_purchase: price,
  }, { transaction });
  return item.get({ plain: true });
};

const getOrdersByUserId = async (userId) => {
  const [results] = await sequelize.query(
    `SELECT o.*,
            json_agg(json_build_object(
              'game_id', oi.game_id,
              'name', g.name,
              'header_image', g.header_image,
              'price', oi.price_at_purchase
            )) as items
     FROM orders o
     JOIN order_items oi ON o.id = oi.order_id
     JOIN games g ON oi.game_id = g.id
     WHERE o.user_id = :userId
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
  );
  return results;
};

const getOrderById = async (orderId, userId) => {
  const [result] = await sequelize.query(
    `SELECT o.*,
            json_agg(json_build_object(
              'game_id', oi.game_id,
              'name', g.name,
              'header_image', g.header_image,
              'price', oi.price_at_purchase
            )) as items
     FROM orders o
     JOIN order_items oi ON o.id = oi.order_id
     JOIN games g ON oi.game_id = g.id
     WHERE o.id = :orderId AND o.user_id = :userId
     GROUP BY o.id`,
    { replacements: { orderId, userId }, type: sequelize.QueryTypes.SELECT }
  );
  return result || null;
};

module.exports = {
  createOrder,
  addOrderItem,
  getOrdersByUserId,
  getOrderById,
};
