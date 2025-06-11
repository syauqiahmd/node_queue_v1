const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = '6h'; // or 15m for better security

exports.generateToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });

exports.verifyToken = (token) => jwt.verify(token, SECRET);
