// models/PatientProfile.js
const mongoose = require('mongoose');

const PatientProfileSchema = new mongoose.Schema({
  // Reference to the User who owns/manages this patient profile
  // This is crucial if one user can manage multiple profiles (e.g., self and family)
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', // References the 'User' model
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please add the patient\'s name'],
    trim: true,
    maxlength: [100, 'Name can not be more than 100 characters'],
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Please add the patient\'s date of birth'],
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    required: [true, 'Please specify the patient\'s gender'],
  },
  diagnoses: [
    {
      type: String, // Example: "Type 2 Diabetes", "Hypertension", "Asthma"
      trim: true,
      maxlength: [150, 'Diagnosis can not be more than 150 characters'],
    },
  ],
  allergies: [
    {
      type: String, // Example: "Penicillin", "Pollen"
      trim: true,
      maxlength: [150, 'Allergy can not be more than 150 characters'],
    },
  ],
  // This field will later reference actual Medication documents
  // For now, it's just an array of IDs
  currentMedications: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Medication', // Will reference a future 'Medication' model
    },
  ],
  medicalHistory: {
    type: String,
    maxlength: [2000, 'Medical history can not be more than 2000 characters'],
    default: '',
  },
  // Basic biometric overview that might be part of the profile
  // Detailed, time-series biometric data will go into a separate HealthRecord model
  lastRecordedBloodPressure: {
    systolic: Number,
    diastolic: Number,
    recordedAt: Date,
  },
  lastRecordedGlucose: {
    value: Number,
    unit: String, // e.g., "mg/dL", "mmol/L"
    recordedAt: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('PatientProfile', PatientProfileSchema);