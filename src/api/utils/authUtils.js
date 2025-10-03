const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthUtils {
  constructor() {
    this.SECRET = process.env.JWT_SECRET;
    this.EXPIRES_IN = '6h';
    this.SALT_ROUNDS = 12;
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
}

module.exports = AuthUtils;
