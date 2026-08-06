const bcrypt = require('bcryptjs');

exports.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

exports.comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

exports.hash = async (data) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(data, salt);
};

exports.compare = async (data, hashedData) => {
  return bcrypt.compare(data, hashedData);
};

exports.generateSalt = async () => {
  return bcrypt.genSalt(10);
};

exports.hashWithSalt = async (data, salt) => {
  return bcrypt.hash(data, salt);
};

exports.isBcryptHash = (hash) => {
  return /^\$2[ayb]\$.{56}$/.test(hash);
};