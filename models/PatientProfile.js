// models/PatientProfile.js
const mongoose = require('mongoose');

const PatientProfileSchema = new mongoose.Schema({
  // Reference to the User who owns/manages this patient profile
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
    enum: ['Male', 'Female', 'Other', 'Prefer not to say'], // Keep String enum for profile
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
  // We will keep 'lastRecordedBloodPressure' and 'lastRecordedGlucose'
  // for quick overview on the main profile, but detailed history goes into healthRecords.
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
  // --- NEW FIELD: healthRecords for time-series data and ML predictions ---
  healthRecords: [
    {
      date: { // Date and time of this specific health record entry
        type: Date,
        default: Date.now,
      },
      // Input features used for the ML model, matching app.py expectations
      age: { type: Number, required: true }, // Age at the time of this record
      gender: { type: Number, enum: [0, 1], required: true }, // 0 for male, 1 for female (ML model's expectation)
      height: { type: Number, required: true }, // in cm
      weight: { type: Number, required: true }, // in kg
      ap_hi: { type: Number, required: true }, // Systolic Blood Pressure
      ap_lo: { type: Number, required: true }, // Diastolic Blood Pressure
      cholesterol: { type: Number, enum: [1, 2, 3], required: true }, // 1: normal, 2: above normal, 3: high
      gluc: { type: Number, enum: [1, 2, 3], required: true }, // 1: normal, 2: above normal, 3: high
      smoke: { type: Number, enum: [0, 1], required: true }, // 0: no, 1: yes
      alco: { type: Number, enum: [0, 1], required: true }, // 0: no, 1: yes
      active: { type: Number, enum: [0, 1], required: true }, // 0: no, 1: yes
      bmi: { type: Number }, // BMI, calculated by ML service (or controller)
      
      // ML Prediction Results
      cvdPredictionClass: { // The predicted class from the ML model (0 or 1)
        type: Number,
        enum: [0, 1],
      },
      cvdPredictionProbabilities: { // Probabilities for low and high risk
        low_risk_proba: Number,
        high_risk_proba: Number,
      },
      cvdAlertTriggered: { // Boolean indicating if an alert was triggered
        type: Boolean,
      },
      // Add any other specific vital signs or health metrics relevant to this snapshot
      notes: { // Optional notes for this specific health record
        type: String,
        maxlength: [500, 'Notes can not be more than 500 characters'],
      }
    }
  ]
});

// Virtual for age calculation if dateOfBirth is primary source for profile view
// patientProfileSchema.virtual('age').get(function() {
//   const today = new Date();
//   const birthDate = this.dateOfBirth;
//   let age = today.getFullYear() - birthDate.getFullYear();
//   const m = today.getMonth() - birthDate.getMonth();
//   if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
//     age--;
//   }
//   return age;
// });

module.exports = mongoose.model('PatientProfile', PatientProfileSchema);