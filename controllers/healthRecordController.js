// controllers/healthRecordController.js
const HealthRecord = require('../models/HealthRecord');
const PatientProfile = require('../models/PatientProfile');
const { callMlService } = require('../utils/mlService'); // Import the ML service utility

// @desc    Add a new health record for a patient
// @route   POST /api/patients/:patientId/healthrecords
// @access  Private (User)
exports.createHealthRecord = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // Check if patient profile exists and belongs to the authenticated user
    const patientProfile = await PatientProfile.findById(patientId);

    if (!patientProfile) {
      return res.status(404).json({ success: false, error: `Patient profile not found with id of ${patientId}` });
    }

    // Make sure user owns the patient profile
    if (patientProfile.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to add health records to this patient profile` });
    }

    // Add patientId to the request body before creating the record
    req.body.patientId = patientId;

    const healthRecord = await HealthRecord.create(req.body);

    res.status(201).json({
      success: true,
      data: healthRecord,
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

// @desc    Get all health records for a specific patient
// @route   GET /api/patients/:patientId/healthrecords
// @access  Private (User)
exports.getHealthRecordsForPatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // Check if patient profile exists and belongs to the authenticated user
    const patientProfile = await PatientProfile.findById(patientId);

    if (!patientProfile) {
      return res.status(404).json({ success: false, error: `Patient profile not found with id of ${patientId}` });
    }

    // Make sure user owns the patient profile
    if (patientProfile.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to view health records for this patient profile` });
    }

    // Fetch health records, sorted by recordedAt descending (most recent first)
    const healthRecords = await HealthRecord.find({ patientId }).sort({ recordedAt: -1 });

    res.status(200).json({
      success: true,
      count: healthRecords.length,
      data: healthRecords,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get health records of a specific type for a patient
// @route   GET /api/patients/:patientId/healthrecords/type/:type
// @access  Private (User)
exports.getHealthRecordsByTypeForPatient = async (req, res, next) => {
  try {
    const { patientId, type } = req.params;

    // Check if patient profile exists and belongs to the authenticated user
    const patientProfile = await PatientProfile.findById(patientId);

    if (!patientProfile) {
      return res.status(404).json({ success: false, error: `Patient profile not found with id of ${patientId}` });
    }

    // Make sure user owns the patient profile
    if (patientProfile.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to view health records for this patient profile` });
    }

    // Fetch health records of a specific type, sorted by recordedAt descending
    const healthRecords = await HealthRecord.find({ patientId, type: type.toLowerCase() }).sort({ recordedAt: -1 });

    res.status(200).json({
      success: true,
      count: healthRecords.length,
      data: healthRecords,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get a single health record by its ID
// @route   GET /api/healthrecords/:id
// @access  Private (User)
exports.getHealthRecord = async (req, res, next) => {
  try {
    const healthRecord = await HealthRecord.findById(req.params.id).populate('patientId', 'userId name'); // Populate patient info

    if (!healthRecord) {
      return res.status(404).json({ success: false, error: `Health record not found with id of ${req.params.id}` });
    }

    // Check if the authenticated user owns the patient profile associated with this health record
    const patientProfile = await PatientProfile.findById(healthRecord.patientId);
    if (!patientProfile || (patientProfile.userId.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to view this health record` });
    }

    res.status(200).json({
      success: true,
      data: healthRecord,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: `Invalid health record ID: ${req.params.id}` });
    }
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update a health record
// @route   PUT /api/healthrecords/:id
// @access  Private (User)
exports.updateHealthRecord = async (req, res, next) => {
  try {
    let healthRecord = await HealthRecord.findById(req.params.id);

    if (!healthRecord) {
      return res.status(404).json({ success: false, error: `Health record not found with id of ${req.params.id}` });
    }

    // Check if the authenticated user owns the patient profile associated with this health record
    const patientProfile = await PatientProfile.findById(healthRecord.patientId);
    if (!patientProfile || (patientProfile.userId.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to update this health record` });
    }

    healthRecord = await HealthRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: healthRecord,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: `Invalid health record ID: ${req.params.id}` });
    }
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Delete a health record
// @route   DELETE /api/healthrecords/:id
// @access  Private (User)
exports.deleteHealthRecord = async (req, res, next) => {
  try {
    const healthRecord = await HealthRecord.findById(req.params.id);

    if (!healthRecord) {
      return res.status(404).json({ success: false, error: `Health record not found with id of ${req.params.id}` });
    }

    // Check if the authenticated user owns the patient profile associated with this health record
    const patientProfile = await PatientProfile.findById(healthRecord.patientId);
    if (!patientProfile || (patientProfile.userId.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to delete this health record` });
    }

    await healthRecord.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: `Invalid health record ID: ${req.params.id}` });
    }
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// --- NEW FUNCTION FOR ML INTEGRATION ---
// @desc    Get latest blood pressure and send to ML service for prediction
// @route   GET /api/patients/:patientId/healthrecords/predict-bp-risk
// @access  Private (User)
exports.predictBpRisk = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // 1. Authenticate and authorize patient profile access
    const patientProfile = await PatientProfile.findById(patientId);
    if (!patientProfile) {
      return res.status(404).json({ success: false, error: `Patient profile not found with id of ${patientId}` });
    }
    if (patientProfile.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to access this patient profile's data.` });
    }

    // 2. Fetch the latest blood pressure record for the patient
    const latestBp = await HealthRecord.findOne({
      patientId,
      type: 'blood_pressure'
    }).sort({ recordedAt: -1 }); // Get the most recent one

    if (!latestBp) {
      return res.status(404).json({ success: false, error: `No blood pressure records found for patient ${patientId}.` });
    }

    // 3. Prepare data for the ML service
    let mlInputFeatures;
    // This logic attempts to extract systolic/diastolic if present
    if (latestBp.value && typeof latestBp.value === 'object' && latestBp.value.systolic && latestBp.value.diastolic) {
      // If BP is stored as { systolic, diastolic } in 'value'
      mlInputFeatures = [latestBp.value.systolic, latestBp.value.diastolic];
    } else if (latestBp.systolic && latestBp.diastolic) { // Fallback if BP was stored directly as separate fields (less likely with your schema)
      mlInputFeatures = [latestBp.systolic, latestBp.diastolic];
    } else {
        // Fallback for our dummy model, assuming a single numeric value
        // You'll replace this with actual feature engineering for your real model
        mlInputFeatures = [latestBp.value || 0]; // Send value if it exists, else 0
    }

    // Our dummy model expects a single feature, so let's pick one for now
    // In a real scenario, you'd send all features your ML model expects
    const dummyFeature = mlInputFeatures[0] || 0; // Use systolic or any first value

    // 4. Call the ML service
    const mlResponse = await callMlService({ features: [dummyFeature] }); // Send features as expected by Flask app

    // 5. Process and send the ML prediction back
    res.status(200).json({
      success: true,
      data: {
        patientId: patientId,
        latestBloodPressure: latestBp,
        mlPrediction: mlResponse.prediction, // Assuming Flask returns { prediction: [...] }
        message: 'ML prediction based on latest blood pressure.'
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: err.message || 'Server Error calling ML service' });
  }
};