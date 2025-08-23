// controllers/healthRecordController.js
const HealthRecord = require('../models/HealthRecord');
const PatientProfile = require('../models/PatientProfile');
const mlService = require('../utils/mlService'); 
const asyncHandler = require('../middleware/asyncHandler'); // Import asyncHandler
const ErrorResponse = require('../utils/errorHandler');   // Import ErrorResponse

// Helper function to check patient profile existence and ownership
const checkPatientProfileAccess = async (req, res, next, patientId) => {
    const patientProfile = await PatientProfile.findById(patientId);

    if (!patientProfile) {
        // Use ErrorResponse for 404 Not Found
        return next(new ErrorResponse(`Patient profile not found with id of ${patientId}`, 404));
    }

    // Make sure user owns the patient profile or is an admin
    if (patientProfile.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        // Use ErrorResponse for 401 Unauthorized
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this patient profile's health records`, 401));
    }
    return patientProfile; // Return the patient profile if authorized
};

// @desc    Add a new health record for a patient
// @route   POST /api/patients/:patientId/healthrecords
// @access  Private (User)
exports.createHealthRecord = asyncHandler(async (req, res, next) => { // Wrapped with asyncHandler
    const { patientId } = req.params;

    // Check authorization using the helper function
    await checkPatientProfileAccess(req, res, next, patientId);


    // Add patientId to the request body before creating the record
    req.body.patientId = patientId;

    const healthRecord = await HealthRecord.create(req.body);

    res.status(201).json({
        success: true,
        data: healthRecord,
    });
});

// @desc    Get all health records for a specific patient
// @route   GET /api/patients/:patientId/healthrecords
// @access  Private (User)
exports.getHealthRecordsForPatient = asyncHandler(async (req, res, next) => { // Wrapped with asyncHandler
    const { patientId } = req.params;

    // Check authorization using the helper function
    await checkPatientProfileAccess(req, res, next, patientId);

    // Fetch health records, sorted by recordedAt descending (most recent first)
    const healthRecords = await HealthRecord.find({ patientId }).sort({ recordedAt: -1 });

    res.status(200).json({
        success: true,
        count: healthRecords.length,
        data: healthRecords,
    });
});

// @desc    Get health records of a specific type for a patient
// @route   GET /api/patients/:patientId/healthrecords/type/:type
// @access  Private (User)
exports.getHealthRecordsByTypeForPatient = asyncHandler(async (req, res, next) => { // Wrapped with asyncHandler
    const { patientId, type } = req.params;

    // Check authorization using the helper function
    await checkPatientProfileAccess(req, res, next, patientId);

    // Fetch health records of a specific type, sorted by recordedAt descending
    const healthRecords = await HealthRecord.find({ patientId, type: type.toLowerCase() }).sort({ recordedAt: -1 });

    res.status(200).json({
        success: true,
        count: healthRecords.length,
        data: healthRecords,
    });
});

// @desc    Get a single health record by its ID
// @route   GET /api/healthrecords/:id
// @access  Private (User)
exports.getHealthRecord = asyncHandler(async (req, res, next) => { // Wrapped with asyncHandler
    const healthRecord = await HealthRecord.findById(req.params.id);

    if (!healthRecord) {
        // Use ErrorResponse for 404 Not Found
        return next(new ErrorResponse(`Health record not found with id of ${req.params.id}`, 404));
    }

    // Check if the authenticated user owns the patient profile associated with this health record
    await checkPatientProfileAccess(req, res, next, healthRecord.patientId);

    res.status(200).json({
        success: true,
        data: healthRecord,
    });
});

// @desc    Update a health record
// @route   PUT /api/healthrecords/:id
// @access  Private (User)
exports.updateHealthRecord = asyncHandler(async (req, res, next) => { // Wrapped with asyncHandler
    let healthRecord = await HealthRecord.findById(req.params.id);

    if (!healthRecord) {
        // Use ErrorResponse for 404 Not Found
        return next(new ErrorResponse(`Health record not found with id of ${req.params.id}`, 404));
    }

    // Check if the authenticated user owns the patient profile associated with this health record
    await checkPatientProfileAccess(req, res, next, healthRecord.patientId);

    const updateBody = { ...req.body };
    healthRecord = await HealthRecord.findByIdAndUpdate(req.params.id, updateBody, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        data: healthRecord,
    });
});

// @desc    Delete a health record
// @route   DELETE /api/healthrecords/:id
// @access  Private (User)
exports.deleteHealthRecord = asyncHandler(async (req, res, next) => { // Wrapped with asyncHandler
    const healthRecord = await HealthRecord.findById(req.params.id);

    if (!healthRecord) {
        // Use ErrorResponse for 404 Not Found
        return next(new ErrorResponse(`Health record not found with id of ${req.params.id}`, 404));
    }

    // Check if the authenticated user owns the patient profile associated with this health record
    await checkPatientProfileAccess(req, res, next, healthRecord.patientId);

    await healthRecord.deleteOne();

    res.status(200).json({
        success: true,
        data: {},
    });
});

exports.predictCvdRisk = asyncHandler(async (req, res, next) => { // Wrapped with asyncHandler
    const { patientId } = req.params;

    // 1. Authenticate and authorize patient profile access
    const patientProfile = await checkPatientProfileAccess(req, res, next, patientId);
    if (!patientProfile) return; // If helper returned an error, it already called next()

    const latestBpRecord = await HealthRecord.findOne({ patientId, type: 'blood_pressure' }).sort({ recordedAt: -1 });

    if (!latestBpRecord) {
        return next(new ErrorResponse(`Cannot predict CVD risk: No recent blood pressure record found for patient ${patientId}.`, 400));
    }

    const {
        age, gender, height, weight, cholesterol, gluc, smoke, alco, active 
    } = req.body;

    // Using values from the latest BP record for ap_hi/ap_lo
    const ap_hi = latestBpRecord.systolic;
    const ap_lo = latestBpRecord.diastolic;

    // Basic validation for ML input (more robust validation should be in middleware)
    if ([age, gender, height, weight, ap_hi, ap_lo, cholesterol, gluc, smoke, alco, active].some(val => val === undefined || val === null)) {
        return next(new ErrorResponse('Missing one or more required health data fields for CVD prediction. Please ensure all 11 features are available.', 400));
    }

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

    // 3. Call the ML service
    const mlResponse = await mlService.predictCvdRisk(mlInputData); // Use the correct function name

    if (mlResponse.error) {
        // Forward error from ML service using ErrorResponse
        return next(new ErrorResponse(mlResponse.error, mlResponse.status || 500));
    }

    // 4. Process and send the ML prediction back
    const { prediction_class, prediction_probabilities, send_alert } = mlResponse;

    res.status(200).json({
        success: true,
        data: {
            patientId: patientId,
            latestRecordUsed: latestBpRecord, // For transparency
            mlPrediction: {
                class: prediction_class,
                probabilities: prediction_probabilities,
                alert: send_alert
            },
            message: 'CVD risk prediction based on latest available health data.'
        }
    });
});