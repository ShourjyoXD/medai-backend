// controllers/medicationController.js
const Medication = require('../models/Medication');
const PatientProfile = require('../models/PatientProfile'); // To ensure patient exists and for population

// @desc    Add a new medication to a patient profile
// @route   POST /api/patients/:patientId/medications
// @access  Private (User)
exports.addMedication = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { name, dosage, frequency, instructions, startDate, endDate, status } = req.body;

    // Check if patient profile exists and belongs to the authenticated user
    const patientProfile = await PatientProfile.findById(patientId);

    if (!patientProfile) {
      return res.status(404).json({ success: false, error: `Patient profile not found with id of ${patientId}` });
    }

    // Make sure user owns the patient profile
    if (patientProfile.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to add medication to this patient profile` });
    }

    // Create medication
    const medication = await Medication.create({
      patientId,
      name,
      dosage,
      frequency,
      instructions,
      startDate,
      endDate,
      status,
    });

    // Optionally, update the PatientProfile's currentMedications array
    // This maintains the reference for easier population from PatientProfile
    patientProfile.currentMedications.push(medication._id);
    await patientProfile.save();

    res.status(201).json({
      success: true,
      data: medication,
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

// @desc    Get all medications for a specific patient
// @route   GET /api/patients/:patientId/medications
// @access  Private (User)
exports.getMedicationsForPatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // Check if patient profile exists and belongs to the authenticated user
    const patientProfile = await PatientProfile.findById(patientId);

    if (!patientProfile) {
      return res.status(404).json({ success: false, error: `Patient profile not found with id of ${patientId}` });
    }

    // Make sure user owns the patient profile
    if (patientProfile.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to view medications for this patient profile` });
    }

    const medications = await Medication.find({ patientId }).populate('patientId', 'name'); // Populate patient name

    res.status(200).json({
      success: true,
      count: medications.length,
      data: medications,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get a single medication by its ID
// @route   GET /api/medications/:id
// @access  Private (User)
exports.getMedication = async (req, res, next) => {
  try {
    const medication = await Medication.findById(req.params.id).populate('patientId', 'userId name'); // Populate patient info

    if (!medication) {
      return res.status(404).json({ success: false, error: `Medication not found with id of ${req.params.id}` });
    }

    // Check if the authenticated user owns the patient profile associated with this medication
    const patientProfile = await PatientProfile.findById(medication.patientId);
    if (!patientProfile || (patientProfile.userId.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to view this medication` });
    }

    res.status(200).json({
      success: true,
      data: medication,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: `Invalid medication ID: ${req.params.id}` });
    }
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update a medication
// @route   PUT /api/medications/:id
// @access  Private (User)
exports.updateMedication = async (req, res, next) => {
  try {
    let medication = await Medication.findById(req.params.id);

    if (!medication) {
      return res.status(404).json({ success: false, error: `Medication not found with id of ${req.params.id}` });
    }

    // Check if the authenticated user owns the patient profile associated with this medication
    const patientProfile = await PatientProfile.findById(medication.patientId);
    if (!patientProfile || (patientProfile.userId.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to update this medication` });
    }

    medication = await Medication.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: medication,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: `Invalid medication ID: ${req.params.id}` });
    }
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Delete a medication
// @route   DELETE /api/medications/:id
// @access  Private (User)
exports.deleteMedication = async (req, res, next) => {
  try {
    const medication = await Medication.findById(req.params.id);

    if (!medication) {
      return res.status(404).json({ success: false, error: `Medication not found with id of ${req.params.id}` });
    }

    // Check if the authenticated user owns the patient profile associated with this medication
    const patientProfile = await PatientProfile.findById(medication.patientId);
    if (!patientProfile || (patientProfile.userId.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(401).json({ success: false, error: `User ${req.user.id} is not authorized to delete this medication` });
    }

    // Remove medication from PatientProfile's currentMedications array
    patientProfile.currentMedications.pull(medication._id);
    await patientProfile.save();

    await medication.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: `Invalid medication ID: ${req.params.id}` });
    }
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};