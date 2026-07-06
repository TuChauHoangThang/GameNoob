const { PaymentCard } = require('../orm');

const saveCard = async (userId, cardType, lastFour, holderName, expiryMonth, expiryYear) => {
  const [card] = await PaymentCard.upsert({
    user_id: userId,
    card_type: cardType,
    last_four: lastFour,
    holder_name: holderName,
    expiry_month: expiryMonth,
    expiry_year: expiryYear,
  }, { conflictFields: ['user_id', 'last_four'] });
  return card.get({ plain: true });
};

const getCardsByUserId = async (userId) => {
  const cards = await PaymentCard.findAll({
    where: { user_id: userId },
    attributes: ['id', 'card_type', 'last_four', 'holder_name', 'expiry_month', 'expiry_year', 'created_at'],
    order: [['created_at', 'DESC']],
  });
  return cards.map((c) => c.get({ plain: true }));
};

const deleteCard = async (cardId, userId) => {
  const card = await PaymentCard.findOne({ where: { id: cardId, user_id: userId } });
  if (!card) return null;
  const plain = card.get({ plain: true });
  await card.destroy();
  return plain;
};

const getCardById = async (cardId, userId) => {
  const card = await PaymentCard.findOne({ where: { id: cardId, user_id: userId } });
  return card ? card.get({ plain: true }) : null;
};

module.exports = { saveCard, getCardsByUserId, deleteCard, getCardById };
