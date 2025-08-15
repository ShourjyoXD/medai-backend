// index.js (or server.js)
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const medicationRoutes = require('./routes/medicationRoutes');
const healthRecordRoutes = require('./routes/healthRecordRoutes'); // Import your new health record routes
const errorHandler = require('./middleware/errorMiddleware'); // <--- NEW: Import the global error handler

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
app.use('/api/patients/:patientId/medications', medicationRoutes);
app.use('/api/medications', medicationRoutes); // For direct access to medication by ID

// Mount health record routes as a nested resource AND as a top-level resource for direct access
// This allows paths like /api/patients/:patientId/healthrecords
app.use('/api/patients/:patientId/healthrecords', healthRecordRoutes);
// And also direct access like /api/healthrecords/:id for individual health record management
app.use('/api/healthrecords', healthRecordRoutes);

// Basic route (for testing server status)
app.get('/', (req, res) => {
    res.send('MedAI API is running...');
});

// <--- NEW: Global Error Handler Middleware (MUST be placed AFTER all route handlers)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Optional: Handle unhandled promise rejections (good practice for robustness)
process.on('unhandledRejection', (err, promise) => {
    console.error(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});