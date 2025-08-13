// index.js (or server.js)
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const medicationRoutes = require('./routes/medicationRoutes'); // Import your new medication routes

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
app.use('/api/patients', patientRoutes);

// Mount medication routes as a nested resource AND as a top-level resource for direct access
// This allows paths like /api/patients/:patientId/medications
app.use('/api/patients/:patientId/medications', medicationRoutes);
// And also direct access like /api/medications/:id for individual medication management
app.use('/api/medications', medicationRoutes);


// Basic route (for testing server status)
app.get('/', (req, res) => {
  res.send('MedAI API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});