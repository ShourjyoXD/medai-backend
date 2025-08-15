// controllers/patientController.js
const PatientProfile = require('../models/PatientProfile');
const User = require('../models/User'); // In case you need to interact with User model directly
const mlService = require('../utils/mlService'); // Assuming this is the correct path to your ML service
const asyncHandler = require('../middleware/asyncHandler'); // <--- NEW: Import asyncHandler
const ErrorResponse = require('../utils/errorHandler');   // <--- NEW: Import ErrorResponse

// @desc    Create a new patient profile
// @route   POST /api/patients
// @access  Private (User)
exports.createPatientProfile = asyncHandler(async (req, res, next) => { // <--- Wrapped with asyncHandler
    // req.user.id comes from the protect middleware, ensuring the user is authenticated
    req.body.userId = req.user.id;

    const patient = await PatientProfile.create(req.body);

    res.status(201).json({
        success: true,
        data: patient,
    });
    // Removed try...catch. Mongoose validation errors (e.g., 'ValidationError', duplicate key error)
    // will now be caught by asyncHandler and automatically passed to the global errorHandler.
});

// @desc    Get all patient profiles for the authenticated user
// @route   GET /api/patients
// @access  Private (User)
exports.getPatientProfiles = asyncHandler(async (req, res, next) => { // <--- Wrapped with asyncHandler
    // Find all patient profiles belonging to the authenticated user
    const patients = await PatientProfile.find({ userId: req.user.id })
        .populate('userId', 'email phoneNumber'); // Populate user info (email and phone number)

        // IMPORTANT: Keep 'currentMedications' populate commented out for now.
        // Uncomment ONLY after you have defined the Medication model in models/Medication.js
        // and created at least one Medication document.
        // .populate('currentMedications', 'name dosage');

    res.status(200).json({
        success: true,
        count: patients.length,
        data: patients,
    });
    // Removed try...catch. Any errors will be caught by asyncHandler.
});

// @desc    Get single patient profile
// @route   GET /api/patients/:id
// @access  Private (User)
exports.getPatientProfile = asyncHandler(async (req, res, next) => { // <--- Wrapped with asyncHandler
    const patient = await PatientProfile.findById(req.params.id)
        .populate('userId', 'email phoneNumber'); // Populate user info for single patient view
        // .populate('currentMedications', 'name dosage'); // Uncomment after Medication model is ready

    if (!patient) {
        // <--- NEW: Use custom ErrorResponse for 404 Not Found
        return next(new ErrorResponse(`Patient profile not found with id of ${req.params.id}`, 404));
    }

    // Make sure user owns the patient profile
    if (patient.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        // <--- NEW: Use custom ErrorResponse for 401 Unauthorized
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to view this patient profile`, 401));
    }

    res.status(200).json({
        success: true,
        data: patient,
    });
    // Removed try...catch. CastError (invalid ID format) will be caught by global errorHandler.
});

// @desc    Update patient profile
// @route   PUT /api/patients/:id
// @access  Private (User)
exports.updatePatientProfile = asyncHandler(async (req, res, next) => { // <--- Wrapped with asyncHandler
    let patient = await PatientProfile.findById(req.params.id);

    if (!patient) {
        // <--- NEW: Use custom ErrorResponse for 404 Not Found
        return next(new ErrorResponse(`Patient profile not found with id of ${req.params.id}`, 404));
    }

    // Make sure user owns the patient profile
    if (patient.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        // <--- NEW: Use custom ErrorResponse for 401 Unauthorized
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this patient profile`, 401));
    }

    patient = await PatientProfile.findByIdAndUpdate(req.params.id, req.body, {
        new: true, // Return the updated document
        runValidators: true, // Run schema validators on update
    });

    res.status(200).json({
        success: true,
        data: patient,
    });
    // Removed try...catch. Mongoose validation errors and CastError will be caught by global errorHandler.
});

// @desc    Delete patient profile
// @route   DELETE /api/patients/:id
// @access  Private (User)
exports.deletePatientProfile = asyncHandler(async (req, res, next) => { // <--- Wrapped with asyncHandler
    const patient = await PatientProfile.findById(req.params.id);

    if (!patient) {
        // <--- NEW: Use custom ErrorResponse for 404 Not Found
        return next(new ErrorResponse(`Patient profile not found with id of ${req.params.id}`, 404));
    }

    // Make sure user owns the patient profile
    if (patient.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        // <--- NEW: Use custom ErrorResponse for 401 Unauthorized
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this patient profile`, 401));
    }

    await patient.deleteOne(); // <--- Changed from patient.remove() if you were using it

    res.status(200).json({
        success: true,
        data: {}, // Convention to send empty object on successful deletion
    });
    // Removed try...catch. CastError will be caught by global errorHandler.
});

// --- NEW: Add this function for recording patient health data and getting ML prediction ---
// @desc    Record patient health data and get CVD risk prediction
// @route   POST /api/patients/:id/health-data
// @access  Private (User)
exports.recordPatientHealthData = asyncHandler(async (req, res, next) => { // <--- Wrapped with asyncHandler
    const patientId = req.params.id; // Get patient ID from URL parameter
    const patient = await PatientProfile.findById(patientId);

    if (!patient) {
        // <--- NEW: Use custom ErrorResponse for 404 Not Found
        return next(new ErrorResponse(`Patient profile not found with id of ${patientId}`, 404));
    }

    // Make sure user owns the patient profile
    if (patient.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        // <--- NEW: Use custom ErrorResponse for 401 Unauthorized
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to record data for this patient profile`, 401));
    }

    // Extract required health data from request body for ML prediction
    // Note: express-validator middleware (in routes) handles basic validation now,
    // so the 'if ([...].some(val => ...))' check for undefined/null inputs is mostly redundant here.
    const {
        age, gender, height, weight, ap_hi, ap_lo, cholesterol,
        gluc, smoke, alco, active, notes // Include notes from the request body
    } = req.body;

    // Prepare data for the ML service, ensuring correct types (numbers)
    const mlInputData = {
        age: Number(age),
        gender: Number(gender),
        height: Number(height),
        weight: Number(weight),
        ap_hi: Number(ap_hi),
        ap_lo: Number(ap_lo),
        cholesterol: Number(cholesterol),
        gluc: Number(gluc),
        smoke: Number(smoke),
        alco: Number(alco),
        active: Number(active)
    };

    // Call the Flask ML service to get prediction
    const mlPrediction = await mlService.predictCvdRisk(mlInputData);

    if (mlPrediction.error) {
        // <--- NEW: Forward error from ML service using ErrorResponse
        return next(new ErrorResponse(mlPrediction.error, mlPrediction.status || 500));
    }

    // Destructure prediction results
    const { prediction_class, prediction_probabilities, send_alert } = mlPrediction;

    // --- Save the health data and prediction to the patient's profile in MongoDB ---
    if (!patient.healthRecords) {
        patient.healthRecords = []; // Initialize if not exists
    }

    patient.healthRecords.push({
        date: new Date(),
        ...mlInputData, // Store the exact input data sent to ML
        bmi: mlInputData.weight / ((mlInputData.height / 100)**2), // Calculate BMI for storage
        cvdPredictionClass: prediction_class,
        cvdPredictionProbabilities: prediction_probabilities,
        cvdAlertTriggered: send_alert,
        notes: notes // Add notes to the health record if provided
    });

    await patient.save(); // Save the updated patient profile

    res.status(200).json({
        success: true,
        message: 'Patient health data recorded and CVD risk prediction obtained.',
        prediction: {
            class: prediction_class,
            probabilities: prediction_probabilities,
            alert: send_alert
        },
        // Optionally, return the newly added health record
        newHealthRecord: patient.healthRecords[patient.healthRecords.length - 1]
    });
    // Removed try...catch. Any Mongoose-related errors or other unhandled errors will be caught by asyncHandler.
});