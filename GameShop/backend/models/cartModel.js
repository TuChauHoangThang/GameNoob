const { Cart, Game } = require('../orm');

const mapCartItem = (item) => {
  const plain = item.get({ plain: true });
  const g = plain.Game;
  return {
    id: plain.id,
    quantity: plain.quantity,
    created_at: plain.created_at,
    game_id: g.id,
    name: g.name,
    header_image: g.header_image,
    price_vnd: g.price_vnd,
    is_free: g.is_free,
  };
};

const getCartByUserId = async (userId) => {
  const items = await Cart.findAll({
    where: { user_id: userId },
    include: [{ model: Game, attributes: ['id', 'name', 'header_image', 'price_vnd', 'is_free'] }],
    order: [['created_at', 'DESC']],
  });
  return items.map(mapCartItem);
};

const addToCart = async (userId, gameId) => {
  const existing = await Cart.findOne({ where: { user_id: userId, game_id: gameId } });
  if (existing) return { alreadyInCart: true };

  const item = await Cart.create({ user_id: userId, game_id: gameId, quantity: 1 });
  return item.get({ plain: true });
};

const updateCartQuantity = async (cartId, userId, quantity) => {
  if (quantity <= 0) return removeFromCart(cartId, userId);

  const item = await Cart.findOne({ where: { id: cartId, user_id: userId } });
  if (!item) return null;
  await item.update({ quantity });
  return item.get({ plain: true });
};

const removeFromCart = async (cartId, userId) => {
  const item = await Cart.findOne({ where: { id: cartId, user_id: userId } });
  if (!item) return null;
  const plain = item.get({ plain: true });
  await item.destroy();
  return plain;
};

const clearCart = async (userId, transaction) => {
  await Cart.destroy({ where: { user_id: userId }, transaction });
};

const getCartCount = async (userId) => {
  return Cart.count({ where: { user_id: userId } });
};

module.exports = {
  getCartByUserId,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  getCartCount,
};
