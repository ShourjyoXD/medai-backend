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

// Validation for recording patient health data
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
    validateHealthData,
    handleValidationErrors
};