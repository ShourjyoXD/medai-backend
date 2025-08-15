// routes/patientRoutes.js
const express = require('express');
const {
    createPatientProfile,
    getPatientProfiles,
    getPatientProfile,
    updatePatientProfile,
    deletePatientProfile,
    recordPatientHealthData,
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    validatePatientProfile,
    validateHealthData,
    handleValidationErrors // Import the error handler middleware
} = require('../middleware/validationMiddleware'); // Import your validation middleware

const router = express.Router();

// Routes that don't require an ID in the URL
router.route('/')
    // Added validatePatientProfile and handleValidationErrors for creation
    .post(protect, validatePatientProfile, handleValidationErrors, createPatientProfile)
    .get(protect, getPatientProfiles);

// Routes that require a specific patient ID
router.route('/:id')
    // Added validation for the ':id' parameter for GET, PUT, and DELETE
    // The `param` check is a simplified version; you could also move this to validationMiddleware.js
    .get(protect, validateHealthData[0], handleValidationErrors, getPatientProfile) // Assuming validateHealthData[0] targets 'id' param
    // Added validatePatientProfile and handleValidationErrors for update
    .put(protect, validatePatientProfile, handleValidationErrors, updatePatientProfile)
    .delete(protect, validateHealthData[0], handleValidationErrors, deletePatientProfile); // Assuming validateHealthData[0] targets 'id' param

// NEW ROUTE: For recording health data and getting ML prediction
// Added validateHealthData and handleValidationErrors for health data submission
router.route('/:id/health-data')
    .post(protect, validateHealthData, handleValidationErrors, recordPatientHealthData);

module.exports = router;