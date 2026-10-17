const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User belonging to token no longer exists' });
      }

      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Not authorized, token failed verification' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token provided' });
};

module.exports = { protect };
