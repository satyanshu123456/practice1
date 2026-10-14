const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
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

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no bearer token provided' });
  }
};

module.exports = { protect };
