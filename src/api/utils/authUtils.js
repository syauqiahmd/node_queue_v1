const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthUtils {
  constructor() {
    this.SECRET = process.env.JWT_SECRET;
    this.EXPIRES_IN = process.env.JWT_EXPIRES_IN || '6h';
    this.SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
  }

  hashPassword(plainPassword) {
    if (typeof plainPassword !== 'string') {
      throw new TypeError('Password must be a string');
    }
    return bcrypt.hash(plainPassword, this.SALT_ROUNDS);
  }

  comparePassword(plainPassword, hashedPassword) {
    if (typeof plainPassword !== 'string' || typeof hashedPassword !== 'string') {
      throw new TypeError('Both passwords must be strings');
    }
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  generateToken(payload) {
    return jwt.sign(payload, this.SECRET, { expiresIn: this.EXPIRES_IN });
  }

  verifyToken(token) {
    return jwt.verify(token, this.SECRET);
  }

  decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = AuthUtils;
