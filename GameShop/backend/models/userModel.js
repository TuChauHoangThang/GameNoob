const { User } = require('../orm');

const getUserByEmail = async (email) => {
  const user = await User.findOne({ where: { email } });
  return user ? user.get({ plain: true }) : null;
};

const createUser = async (username, email, hashedPassword) => {
  const user = await User.create({ username, email, password: hashedPassword });
  return { id: user.id, username: user.username, email: user.email };
};

module.exports = { getUserByEmail, createUser };
