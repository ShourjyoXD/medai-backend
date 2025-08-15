// index.js (or server.js)
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const medicationRoutes = require('./routes/medicationRoutes');
const healthRecordRoutes = require('./routes/healthRecordRoutes');
const errorHandler = require('./middleware/errorMiddleware'); // Import the global error handler

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

// Mount medication routes:
// 1. As a nested resource under a specific patient
// The medicationRoutes router will use `mergeParams: true` to access `patientId`.
app.use('/api/patients/:patientId/medications', medicationRoutes);

// 2. As a top-level resource for direct access to individual medications (e.g., PUT, GET, DELETE by medication ID).
// This works because the medicationRoutes defines paths like '/:id' for these operations.
app.use('/api/medications', medicationRoutes);


// Mount health record routes:
// 1. As a nested resource under a specific patient
// The healthRecordRoutes router will use `mergeParams: true` to access `patientId`.
app.use('/api/patients/:patientId/healthrecords', healthRecordRoutes);

// 2. As a top-level resource for direct access to individual health records (e.g., PUT, GET, DELETE by health record ID).
// This also works because healthRecordRoutes defines paths like '/:id' for direct access.
app.use('/api/healthrecords', healthRecordRoutes);


// Basic route (for testing server status)
app.get('/', (req, res) => {
    res.send('MedAI API is running...');
});

// Global Error Handler Middleware (MUST be placed AFTER all route handlers)
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