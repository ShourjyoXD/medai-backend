// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }
  

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to the request object
    // We explicitly exclude the password here as it was selected: false in the model
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
        return res.status(404).json({ success: false, error: 'No user found with this ID' });
    }

    next();
  } catch (err) {
    console.error(err.message);
    res.status(401).json({ success: false, error: 'Not authorized, token failed' });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: `User role ${req.user.role} is not authorized to access this route` });
    }
    next();
  };
};