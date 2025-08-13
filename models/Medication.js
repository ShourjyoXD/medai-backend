// models/Medication.js
const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema({
  // Reference to the patient this medication belongs to
  patientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'PatientProfile', // References the 'PatientProfile' model
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please add the medication name'],
    trim: true,
    maxlength: [100, 'Medication name cannot be more than 100 characters'],
  },
  dosage: {
    type: String, // e.g., "10mg", "2 tablets", "5ml"
    required: [true, 'Please add the dosage'],
    trim: true,
    maxlength: [50, 'Dosage cannot be more than 50 characters'],
  },
  frequency: {
    type: String, // e.g., "Once daily", "Twice a day", "Every 4 hours"
    required: [true, 'Please add the frequency'],
    trim: true,
    maxlength: [100, 'Frequency cannot be more than 100 characters'],
  },
  instructions: {
    type: String, // e.g., "Take with food", "Do not crush", "Before bed"
    maxlength: [500, 'Instructions cannot be more than 500 characters'],
    default: '',
  },
  startDate: {
    type: Date,
    required: [true, 'Please add the start date of the medication'],
  },
  endDate: {
    type: Date,
    // Optional: Only required if it's a temporary medication
  },
  status: {
    type: String,
    enum: ['active', 'discontinued', 'completed'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Medication', MedicationSchema);