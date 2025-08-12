// routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController'); // Import the whole object
const authMiddleware = require('../middleware/authMiddleware'); // Import the whole object

// Destructure after checking
const { register, login, getMe } = authController;
const { protect } = authMiddleware;

console.log('authController object:', authController);
console.log('authMiddleware object:', authMiddleware);
console.log('Type of register:', typeof register);
console.log('Type of login:', typeof login);
console.log('Type of getMe:', typeof getMe);
console.log('Type of protect:', typeof protect);

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;