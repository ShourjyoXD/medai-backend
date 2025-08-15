// middleware/validationMiddleware.js
const { body, check, param, validationResult } = require('express-validator');

// Validation for patient profile creation/update
const validatePatientProfile = [
    body('name')
        .trim()
        .notEmpty().withMessage('Patient name is required.')
        .isLength({ max: 100 }).withMessage('Name cannot be more than 100 characters.'),
    body('dateOfBirth')
        .isISO8601().toDate().withMessage('Invalid date of birth format (YYYY-MM-DD).')
        .custom((value) => {
            if (new Date(value) > new Date()) {
                throw new Error('Date of birth cannot be in the future.');
            }
            return true;
        }),
    body('gender')
        .isIn(['Male', 'Female', 'Other', 'Prefer not to say']).withMessage('Invalid gender specified.'),
    body('diagnoses.*') // Validate each item in the diagnoses array
        .optional()
        .trim()
        .isLength({ max: 150 }).withMessage('Diagnosis cannot be more than 150 characters.'),
    body('allergies.*') // Validate each item in the allergies array
        .optional()
        .trim()
        .isLength({ max: 150 }).withMessage('Allergy cannot be more than 150 characters.'),
    body('medicalHistory')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Medical history cannot be more than 2000 characters.'),
    // You can add more specific validations for lastRecordedBloodPressure and lastRecordedGlucose if they were to be updated directly via the profile endpoint
    // For example:
    // body('lastRecordedBloodPressure.systolic').optional().isNumeric().withMessage('Systolic BP must be a number.'),
    // body('lastRecordedBloodPressure.diastolic').optional().isNumeric().withMessage('Diastolic BP must be a number.'),
    // body('lastRecordedGlucose.value').optional().isNumeric().withMessage('Glucose value must be a number.'),
    // body('lastRecordedGlucose.unit').optional().isIn(['mg/dL', 'mmol/L']).withMessage('Invalid glucose unit.'),
];

// Validation for recording patient health data (if you use this for embedded records in PatientProfile)
const validateHealthData = [
    param('id').isMongoId().withMessage('Invalid Patient ID format.'),
    body('age')
        .isInt({ min: 0, max: 120 }).withMessage('Age must be an integer between 0 and 120.'),
    body('gender')
        .isInt({ min: 0, max: 1 }).withMessage('Gender must be 0 (male) or 1 (female) for ML model.'),
    body('height')
        .isFloat({ min: 50, max: 250 }).withMessage('Height must be a number between 50 and 250 cm.'),
    body('weight')
        .isFloat({ min: 20, max: 300 }).withMessage('Weight must be a number between 20 and 300 kg.'),
    body('ap_hi')
        .isInt({ min: 50, max: 300 }).withMessage('Systolic BP (ap_hi) must be an integer between 50 and 300.'),
    body('ap_lo')
        .isInt({ min: 30, max: 200 }).withMessage('Diastolic BP (ap_lo) must be an integer between 30 and 200.'),
    body('cholesterol')
        .isIn([1, 2, 3]).withMessage('Cholesterol must be 1 (normal), 2 (above normal), or 3 (high).'),
    body('gluc')
        .isIn([1, 2, 3]).withMessage('Glucose must be 1 (normal), 2 (above normal), or 3 (high).'),
    body('smoke')
        .isIn([0, 1]).withMessage('Smoke must be 0 (no) or 1 (yes).'),
    body('alco')
        .isIn([0, 1]).withMessage('Alcohol must be 0 (no) or 1 (yes).'),
    body('active')
        .isIn([0, 1]).withMessage('Active must be 0 (no) or 1 (yes).'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Notes cannot be more than 500 characters.'),
];

// --- NEW VALIDATION SCHEMAS ---

// Validation for medication creation/update
const validateMedication = [
    body('name')
        .trim()
        .notEmpty().withMessage('Medication name is required.')
        .isLength({ max: 100 }).withMessage('Medication name cannot be more than 100 characters.'),
    body('dosage')
        .trim()
        .notEmpty().withMessage('Dosage is required.')
        .isLength({ max: 50 }).withMessage('Dosage cannot be more than 50 characters.'),
    body('frequency')
        .trim()
        .notEmpty().withMessage('Frequency is required.')
        .isLength({ max: 100 }).withMessage('Frequency cannot be more than 100 characters.'),
    body('instructions')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Instructions cannot be more than 500 characters.'),
    body('startDate')
        .isISO8601().toDate().withMessage('Invalid start date format (YYYY-MM-DD).')
        .notEmpty().withMessage('Start date is required.'), // Your Medication model has startDate as required
    body('endDate')
        .optional()
        .isISO8601().toDate().withMessage('Invalid end date format (YYYY-MM-DD).')
        .custom((value, { req }) => {
            if (req.body.startDate && value && new Date(value) < new Date(req.body.startDate)) {
                throw new Error('End date cannot be before start date.');
            }
            return true;
        }),
    body('status')
        .optional()
        .isIn(['active', 'discontinued', 'completed']).withMessage('Invalid medication status.'),
];

// Validation for standalone HealthRecord creation/update
const validateHealthRecordBody = [
    body('type')
        .trim()
        .notEmpty().withMessage('Health record type is required.')
        .isIn(['blood_pressure', 'glucose', 'weight', 'heart_rate', 'symptom_log', 'activity', 'food_intake', 'sleep', 'other'])
        .withMessage('Invalid health record type.'),
    body('recordedAt')
        .isISO8601().toDate().withMessage('Invalid recorded date format (YYYY-MM-DDTHH:mm:ssZ or YYYY-MM-DD).')
        .notEmpty().withMessage('Recorded date is required.')
        .custom((value) => {
            if (new Date(value) > new Date()) {
                throw new Error('Recorded date cannot be in the future.');
            }
            return true;
        }),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Notes cannot be more than 1000 characters.'),

    // Conditional validation based on 'type' for 'value', 'systolic', 'diastolic', 'unit'
    body('value')
        .optional() // Value might not be present for all types
        .isNumeric().withMessage('Value must be a number for this record type.')
        .custom((value, { req }) => {
            const type = req.body.type;
            if (['glucose', 'weight', 'heart_rate'].includes(type) && (value === undefined || value === null)) {
                throw new Error(`'value' is required for '${type}' record type.`);
            }
            if (['blood_pressure'].includes(type) && (value !== undefined && value !== null)) {
                throw new Error(`'value' field should not be used for 'blood_pressure' type. Use 'systolic' and 'diastolic' instead.`);
            }
            return true;
        }),
    body('unit')
        .optional()
        .trim()
        .isLength({ max: 20 }).withMessage('Unit cannot be more than 20 characters.')
        .custom((value, { req }) => {
            // Unit is required if 'value' is provided and is a number
            if (req.body.value !== undefined && req.body.value !== null && typeof req.body.value === 'number' && (!value || value.trim() === '')) {
                throw new Error(`'unit' is required when a numerical 'value' is provided.`);
            }
            return true;
        }),
    body('systolic')
        .optional()
        .isInt({ min: 0 }).withMessage('Systolic value must be a non-negative integer.')
        .custom((value, { req }) => {
            const type = req.body.type;
            if (type === 'blood_pressure' && (value === undefined || value === null)) {
                throw new Error(`'systolic' is required for 'blood_pressure' record type.`);
            }
            if (!['blood_pressure'].includes(type) && (value !== undefined && value !== null)) {
                throw new Error(`'systolic' field should not be used for '${type}' record type.`);
            }
            return true;
        }),
    body('diastolic')
        .optional()
        .isInt({ min: 0 }).withMessage('Diastolic value must be a non-negative integer.')
        .custom((value, { req }) => {
            const type = req.body.type;
            if (type === 'blood_pressure' && (value === undefined || value === null)) {
                throw new Error(`'diastolic' is required for 'blood_pressure' record type.`);
            }
            if (!['blood_pressure'].includes(type) && (value !== undefined && value !== null)) {
                throw new Error(`'diastolic' field should not be used for '${type}' record type.`);
            }
            return true;
        }),

    // Ensure that for 'symptom_log', 'activity', 'food_intake', 'sleep', 'other',
    // numerical 'value', 'systolic', 'diastolic' are NOT directly used, only notes and type.
    // This is more of an implicit check based on the required fields above.
    // Explicitly, we could add:
    body(['age', 'gender', 'height', 'weight', 'cholesterol', 'gluc', 'smoke', 'alco', 'active'])
        .optional() // These are generally not part of a singular HealthRecord model unless it's a specific ML-input type.
        // If these fields are coming from the client for the ML model directly via a POST request
        // (e.g., to create a 'cvd_screening' record), you'd validate them here.
        // But for a generic HealthRecord, they shouldn't be present unless type dictates.
        .custom((value, { req }) => {
            // Prevent common ML features from being passed in a generic health record creation
            // unless the 'type' specifically indicates a comprehensive record for ML.
            // Adjust this logic if you introduce a specific 'cvd_screening' type.
            const genericTypes = ['blood_pressure', 'glucose', 'weight', 'heart_rate', 'symptom_log', 'activity', 'food_intake', 'sleep', 'other'];
            if (genericTypes.includes(req.body.type) && value !== undefined && value !== null) {
                // This is a weak check, as 'value' might be valid for specific types.
                // Reconsider this whole block if you have a dedicated 'cvd_screening' type.
                // For now, these fields are not part of the `HealthRecord` model itself.
            }
            return true;
        }),
];

// Validation for specific ID in URL params (patientId, medicationId, healthRecordId, userId)
const validateObjectIdParam = (paramName) => {
    return [
        param(paramName).isMongoId().withMessage(`Invalid ${paramName} format.`)
    ];
};


// Middleware to check validation results
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array({ formatter: ({ msg, param }) => ({ field: param, message: msg }) })
        });
    }
    next();
};

module.exports = {
    validatePatientProfile,
    validateHealthData, // Keep this if you still use it for embedded health records in PatientProfile
    validateMedication, // <--- NEW
    validateHealthRecordBody, // <--- NEW for standalone HealthRecord model
    validateObjectIdParam, // <--- NEW
    handleValidationErrors
};