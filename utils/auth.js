const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12; // Recommended for most applications

/**
 * Hash a plain password using bcrypt
 * @param {string} plainPassword
 * @returns {Promise<string>} hashed password
 */
const hashPassword = (plainPassword) => {
  if (typeof plainPassword !== 'string') {
    throw new TypeError('Password must be a string');
  }
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

/**
 * Compare a plain password with a hashed password
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
const comparePassword = (plainPassword, hashedPassword) => {
  if (typeof plainPassword !== 'string' || typeof hashedPassword !== 'string') {
    throw new TypeError('Both passwords must be strings');
  }
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword,
};
