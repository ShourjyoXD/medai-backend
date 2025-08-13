// models/HealthRecord.js
const mongoose = require('mongoose');

const HealthRecordSchema = new mongoose.Schema({
  // Reference to the patient this health record belongs to
  patientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'PatientProfile', // References the 'PatientProfile' model
    required: true,
  },
  // Type of health record (e.g., 'blood_pressure', 'glucose', 'weight', 'symptom_log')
  type: {
    type: String,
    required: [true, 'Please add the type of health record'],
    enum: [
      'blood_pressure',
      'glucose',
      'weight',
      'heart_rate',
      'symptom_log',
      'activity',
      'food_intake',
      'sleep',
      'other'
    ],
    lowercase: true, // Store types in lowercase for consistency
  },
  // Data for the health record - flexible structure based on 'type'
  // For structured data like BP, glucose, use nested objects/fields
  // For simple values, use a direct 'value' field
  value: {
    type: mongoose.Schema.Types.Mixed, // Allows for flexible data types (numbers, strings, objects)
    required: function() {
      // 'value' is required unless it's a symptom log which might only have 'notes'
      return this.type !== 'symptom_log' && this.type !== 'activity' && this.type !== 'food_intake' && this.type !== 'sleep';
    },
    // Example for BP: { systolic: 120, diastolic: 80 }
    // Example for Glucose: 105
  },
  unit: {
    type: String, // e.g., "mmHg", "mg/dL", "mmol/L", "kg", "lbs", "bpm", "steps"
    trim: true,
    maxlength: [20, 'Unit cannot be more than 20 characters'],
    // Required if 'value' is a number
    required: function() {
        return typeof this.value === 'number';
    }
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters'],
    default: '',
  },
  // For 'blood_pressure' type
  systolic: {
    type: Number,
    min: [0, 'Systolic value cannot be negative'],
    // Required if type is blood_pressure, but not if 'value' field is used for an object
    required: function() {
        return this.type === 'blood_pressure' && (typeof this.value !== 'object' || !this.value.systolic);
    },
  },
  diastolic: {
    type: Number,
    min: [0, 'Diastolic value cannot be negative'],
    // Required if type is blood_pressure
    required: function() {
        return this.type === 'blood_pressure' && (typeof this.value !== 'object' || !this.value.diastolic);
    },
  },
  // Timestamp of when the record was taken (e.g., blood pressure reading time)
  recordedAt: {
    type: Date,
    default: Date.now,
  },
  // When the record was created in the database
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index to quickly query health records by patient and type, and then by time
HealthRecordSchema.index({ patientId: 1, type: 1, recordedAt: -1 });

module.exports = mongoose.model('HealthRecord', HealthRecordSchema);