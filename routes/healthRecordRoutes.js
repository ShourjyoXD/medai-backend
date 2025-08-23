// routes/healthRecordRoutes.js
const express = require('express');
const {
    createHealthRecord,
    getHealthRecordsForPatient,
    getHealthRecordsByTypeForPatient,
    getHealthRecord,
    updateHealthRecord,
    deleteHealthRecord,
    predictCvdRisk // Corrected function name from predictBpRisk to predictCvdRisk
} = require('../controllers/healthRecordController');
const { protect } = require('../middleware/authMiddleware');
const {
    validateObjectIdParam,
    validateHealthRecordBody, // For validating the health record creation/update body
    handleValidationErrors
} = require('../middleware/validationMiddleware');

// We merge params from the parent router (patientRoutes) to get patientId
const router = express.Router({ mergeParams: true });

// ----------------------------------------------------------------------

// Routes for adding and getting all health records for a specific patient
router.route('/')
    .post(
        protect,
        validateObjectIdParam('patientId'), // Validate patientId from URL param
        validateHealthRecordBody,           // Validate the request body for health record
        handleValidationErrors,             // Handle any validation errors
        createHealthRecord
    )
    .get(
        protect,
        validateObjectIdParam('patientId'), // Validate patientId from URL param
        handleValidationErrors,
        getHealthRecordsForPatient
    );

// ----------------------------------------------------------------------

// Route for getting health records of a specific type for a patient
router.route('/type/:type')
    .get(
        protect,
        validateObjectIdParam('patientId'), // Validate patientId from URL param
        // You might want to add validation for :type here as well if it's not a strict enum on the client side
        handleValidationErrors,
        getHealthRecordsByTypeForPatient
    );

// ----------------------------------------------------------------------

// Route to get patient health data and send to ML service for CVD risk prediction
router.route('/predict-cvd-risk') // Corrected route name to reflect CVD prediction
    .post( // Changed from .get to .post
        protect,
        validateHealthRecordBody, // Assuming you will add new validation rules for ML data
        handleValidationErrors,
        predictCvdRisk // This function will access req.body
    );

// ----------------------------------------------------------------------

// Routes for specific health records (by health record ID)
// These routes do NOT require patientId in the URL if accessed directly via /api/healthrecords/:id
router.route('/:id')
    .get(
        protect,
        validateObjectIdParam('id'), // Validate the health record ID from URL param
        handleValidationErrors,
        getHealthRecord
    )
    .put(
        protect,
        validateObjectIdParam('id'),       // Validate the health record ID from URL param
        validateHealthRecordBody,          // Validate the request body for update
        handleValidationErrors,
        updateHealthRecord
    )
    .delete(
        protect,
        validateObjectIdParam('id'),       // Validate the health record ID from URL param
        handleValidationErrors,
        deleteHealthRecord
    );

// ----------------------------------------------------------------------

module.exports = router;