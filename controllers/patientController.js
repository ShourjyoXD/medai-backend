// controllers/patientController.js
const PatientProfile = require('../models/PatientProfile');
const User = require('../models/User'); // In case you need to interact with User model directly
const mlService = require('../utils/mlService'); // <--- NEW: Import the ML service

// @desc    Create a new patient profile
// @route   POST /api/patients
// @access  Private (User)
exports.createPatientProfile = async (req, res, next) => {
    try {
        // req.user.id comes from the protect middleware, ensuring the user is authenticated
        req.body.userId = req.user.id;

        const patient = await PatientProfile.create(req.body);

        res.status(201).json({
            success: true,
            data: patient,
        });
    } catch (err) {
        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages.join(', ') });
        }
        console.error(err.message);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get all patient profiles for the authenticated user
// @route   GET /api/patients
// @access  Private (User)
exports.getPatientProfiles = async (req, res, next) => {
    try {
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
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get single patient profile
// @route   GET /api/patients/:id
// @access  Private (User)
exports.getPatientProfile = async (req, res, next) => {
    try {
        const patient = await PatientProfile.findById(req.params.id)
            .populate('userId', 'email phoneNumber'); // Populate user info for single patient view
            // .populate('currentMedications', 'name dosage'); // Uncomment after Medication model is ready

        if (!patient) {
            return res.status(404).json({ success: false, error: `Patient profile not found with id of ${req.params.id}` });
        }

        // Make sure user owns the patient profile
        if (patient.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to view this patient profile` });
        }

        res.status(200).json({
            success: true,
            data: patient,
        });
    } catch (err) {
        // Handle invalid ID format
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, error: `Invalid patient profile ID: ${req.params.id}` });
        }
        console.error(err.message);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Update patient profile
// @route   PUT /api/patients/:id
// @access  Private (User)
exports.updatePatientProfile = async (req, res, next) => {
    try {
        let patient = await PatientProfile.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ success: false, error: `Patient profile not found with id of ${req.params.id}` });
        }

        // Make sure user owns the patient profile
        if (patient.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to update this patient profile` });
        }

        patient = await PatientProfile.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return the updated document
            runValidators: true, // Run schema validators on update
        });

        res.status(200).json({
            success: true,
            data: patient,
        });
    } catch (err) {
        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages.join(', ') });
        }
        // Handle invalid ID format
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, error: `Invalid patient profile ID: ${req.params.id}` });
        }
        console.error(err.message);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Delete patient profile
// @route   DELETE /api/patients/:id
// @access  Private (User)
exports.deletePatientProfile = async (req, res, next) => {
    try {
        const patient = await PatientProfile.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ success: false, error: `Patient profile not found with id of ${req.params.id}` });
        }

        // Make sure user owns the patient profile
        if (patient.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to delete this patient profile` });
        }

        await patient.deleteOne();

        res.status(200).json({
            success: true,
            data: {}, // Convention to send empty object on successful deletion
        });
    } catch (err) {
        // Handle invalid ID format
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, error: `Invalid patient profile ID: ${req.params.id}` });
        }
        console.error(err.message);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// --- NEW: Add this function for recording patient health data and getting ML prediction ---
// @desc    Record patient health data and get CVD risk prediction
// @route   POST /api/patients/:id/health-data  <--- This is a new route
// @access  Private (User)
exports.recordPatientHealthData = async (req, res, next) => {
    try {
        const patientId = req.params.id; // Get patient ID from URL parameter
        const patient = await PatientProfile.findById(patientId);

        if (!patient) {
            return res.status(404).json({ success: false, error: `Patient profile not found with id of ${patientId}` });
        }

        // Make sure user owns the patient profile
        if (patient.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to record data for this patient profile` });
        }

        // Extract required health data from request body for ML prediction
        const {
            age, // Usually part of profile, but can be sent with health data for latest
            gender, // Same as age
            height, // Same as age
            weight,
            ap_hi,
            ap_lo,
            cholesterol,
            gluc,
            smoke,
            alco,
            active
        } = req.body;

        // Basic validation for ML input
        if ([age, gender, height, weight, ap_hi, ap_lo, cholesterol, gluc, smoke, alco, active].some(val => val === undefined || val === null)) {
            return res.status(400).json({ message: 'Missing one or more required health data fields for CVD prediction.' });
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

        // Call the Flask ML service to get prediction
        const mlPrediction = await mlService.predictCvdRisk(mlInputData);

        if (mlPrediction.error) {
            // Forward error from ML service
            return res.status(mlPrediction.status || 500).json({ success: false, error: mlPrediction.error });
        }

        // Destructure prediction results
        const { prediction_class, prediction_probabilities, send_alert } = mlPrediction;

        // --- Save the health data and prediction to the patient's profile in MongoDB ---
        // Assuming your PatientProfile schema has a field like `healthRecords` which is an array of objects
        // Each object in `healthRecords` could store a snapshot of vital signs and the corresponding ML prediction.
        if (!patient.healthRecords) {
            patient.healthRecords = []; // Initialize if not exists
        }

        patient.healthRecords.push({
            date: new Date(),
            ...mlInputData, // Store the exact input data sent to ML
            bmi: mlInputData.weight / ((mlInputData.height / 100)**2), // Calculate BMI for storage
            cvdPredictionClass: prediction_class,
            cvdPredictionProbabilities: prediction_probabilities,
            cvdAlertTriggered: send_alert
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

    } catch (err) {
        console.error('Error in recordPatientHealthData:', err.message);
        // Handle Mongoose validation errors if healthRecords sub-schema has validation
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages.join(', ') });
        }
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};