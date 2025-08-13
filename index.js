// index.js (or server.js)
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes'); // Import your new patient routes

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser middleware (to parse JSON from requests)
app.use(express.json());

// Mount authentication routes
app.use('/api/auth', authRoutes);

// Mount patient profile routes
// All routes under /api/patients will now be handled by patientRoutes
app.use('/api/patients', patientRoutes);

// Basic route (for testing server status)
app.get('/', (req, res) => {
  res.send('MedAI API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});