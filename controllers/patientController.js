// controllers/patientController.js
const PatientProfile = require('../models/PatientProfile');
const User = require('../models/User'); // In case you need to interact with User model directly

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
      .populate('userId', 'email phoneNumber') // Optionally populate user info
      .populate('currentMedications', 'name dosage'); // Populate medication names/dosages if Medication model is ready

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
    const patient = await PatientProfile.findById(req.params.id);

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

    await patient.deleteOne(); // Use deleteOne() or remove() in Mongoose 5/6, or findByIdAndDelete in Mongoose 7+

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