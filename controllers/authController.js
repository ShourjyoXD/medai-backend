// controllers/authController.js
const User = require('../models/User'); // Import the User model

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  console.log('Register route hit! Request body:', req.body);
  try {
    const { email, password, phoneNumber, emergencyContact1, emergencyContact2, emergencyContact3 } = req.body;

    // Create user
    const user = await User.create({
      email,
      password,
      phoneNumber,
      emergencyContact1,
      emergencyContact2,
      emergencyContact3,
    });

    sendTokenResponse(user, 200, res);

  } catch (err) {
    // Basic error handling for duplicate fields (e.g., email, phoneNumber)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const message = `Duplicate field value entered for ${field}: ${err.keyValue[field]}. Please use another value.`;
      return res.status(400).json({ success: false, error: message });
    }
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please enter an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password'); // Explicitly select password

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  // You can set options for the cookie here if you want to use HttpOnly cookies
  // const options = {
  //   expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000), // e.g., 30 days
  //   httpOnly: true,
  // };

  // If you are using HTTPS in production, uncomment the following line
  // if (process.env.NODE_ENV === 'production') {
  //   options.secure = true;
  // }

  // We are sending token directly in JSON for React Native
  res.status(statusCode).json({
    success: true,
    token,
    user: {
        id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        emergencyContact1: user.emergencyContact1,
        emergencyContact2: user.emergencyContact2,
        emergencyContact3: user.emergencyContact3,
        role: user.role,
    }
  });

  // If you were setting cookies:
  // res.status(statusCode).cookie('token', token, options).json({
  //   success: true,
  //   token, // Still good practice to send token in JSON for mobile apps
  //   user: {
  //      id: user._id, // and other user data you want to send
  //   }
  // });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};