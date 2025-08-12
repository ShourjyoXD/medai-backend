// index.js (or server.js)
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); // Your DB connection
const authRoutes = require('./routes/authRoutes'); // Your auth routes

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser middleware (to parse JSON from requests)
app.use(express.json());

// Mount authentication routes
app.use('/api/auth', authRoutes);

// Example of a protected route (e.g., to get patient data)
// const { protect, authorize } = require('./middleware/authMiddleware');
// app.get('/api/patients', protect, authorize('user', 'doctor', 'admin'), (req, res) => {
//   res.status(200).json({ success: true, message: `Welcome ${req.user.email}! Here's your patient data.` });
// });


// Basic route (for testing server status)
app.get('/', (req, res) => {
  res.send('MedAI API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});