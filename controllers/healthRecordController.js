// controllers/healthRecordController.js
const HealthRecord = require('../models/HealthRecord');
const PatientProfile = require('../models/PatientProfile');
const mlService = require('../utils/mlService'); // Assuming this is the correct path to your ML service
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

    // If you are using the separate HealthRecord model and this endpoint
    // you might want to integrate ML prediction here directly if every new record implies a prediction
    // OR keep this simple for just recording, and use predictBpRisk for specific prediction requests.

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

    // Prevent direct update of ML-generated fields if they were part of the HealthRecord schema
    // (This is based on the assumption you might add ML fields to this HealthRecord model later)
    // For now, these are not directly in HealthRecord, but good to keep in mind for updates.
    const updateBody = { ...req.body };
    // If you intend for ML fields to be here, uncomment and refine:
    // delete updateBody.cvdPredictionClass;
    // delete updateBody.cvdPredictionProbabilities;
    // delete updateBody.cvdAlertTriggered;

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

// --- NEW FUNCTION FOR ML INTEGRATION ---
// @desc    Get patient health data and send to ML service for CVD risk prediction
// @route   GET /api/patients/:patientId/healthrecords/predict-cvd-risk
// @access  Private (User)
exports.predictCvdRisk = asyncHandler(async (req, res, next) => { // Wrapped with asyncHandler
    const { patientId } = req.params;

    // 1. Authenticate and authorize patient profile access
    const patientProfile = await checkPatientProfileAccess(req, res, next, patientId);
    if (!patientProfile) return; // If helper returned an error, it already called next()

    // 2. Fetch the latest required health records for the patient
    // Based on your HealthRecord schema and typical CVD models, we need specific data points.
    // This is a simplified example; a real ML model might need all features from the last record.

    // Let's assume we need all the 11 features that your Flask ML model expects
    // from a single, comprehensive health record.
    // For this, we'll fetch the most recent 'comprehensive' health record or the latest of each type.
    // The most robust way is to have a health record that stores all required features in one entry.
    // If your health records are granular (e.g., separate BP, glucose records), you'd need to fetch each
    // latest type and combine them.

    // For simplicity, let's assume the ML model uses the same features as previously discussed for patientController's recordPatientHealthData:
    // age, gender, height, weight, ap_hi, ap_lo, cholesterol, gluc, smoke, alco, active

    // If HealthRecord stores these *individually*, you'd need to fetch them:
    // const latestBloodPressure = await HealthRecord.findOne({ patientId, type: 'blood_pressure' }).sort({ recordedAt: -1 });
    // const latestGlucose = await HealthRecord.findOne({ patientId, type: 'glucose' }).sort({ recordedAt: -1 });
    // etc.
    // Then combine them into mlInputData.

    // A more practical approach for ML prediction:
    // Either the client sends the full set of features from the latest available data,
    // or you have a specific "CVD_RISK_RECORD" type in HealthRecord that contains all these fields.
    // For now, let's just use the `patientProfile` data and assume that's what the ML service needs
    // along with potentially latest BP from HealthRecords.

    // This section needs to gather ALL the 11 features required by your Flask ML model.
    // Given your `HealthRecord` model is for specific types, you'd have to combine data from `PatientProfile`
    // and multiple `HealthRecord` entries if they are truly granular.
    // For a quick fix, let's grab general patient profile info and the latest BP.
    // **This is a placeholder; you MUST ensure these features match your actual ML model's input expectations.**
    const latestBpRecord = await HealthRecord.findOne({ patientId, type: 'blood_pressure' }).sort({ recordedAt: -1 });

    if (!latestBpRecord) {
        return next(new ErrorResponse(`Cannot predict CVD risk: No recent blood pressure record found for patient ${patientId}.`, 400));
    }

    // Extract necessary data from patientProfile and latestBpRecord
    // Assuming patientProfile has age, gender, height, weight, cholesterol, gluc, smoke, alco, active
    // This requires your PatientProfile model to have these fields or default values for a baseline prediction.
    // For now, let's pull them directly from req.body as a placeholder if not in patientProfile or HealthRecord.
    // In a real app, you'd need a strategy to get all 11 features consistently.
    const {
        age, gender, height, weight, cholesterol, gluc, smoke, alco, active // These must come from somewhere
    } = req.body; // TEMPORARY: These should ideally come from patientProfile or other latest HealthRecords

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