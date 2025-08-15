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
        trim: true,
    },
    // --- Refined Data Fields ---
    // Single 'value' field for simple numerical records (glucose, weight, heart_rate)
    // For types like 'blood_pressure', use dedicated 'systolic' and 'diastolic'
    value: {
        type: Number, // Restrict to Number for specific types
        // Required only for types that are expected to have a single numeric value
        required: function() {
            return ['glucose', 'weight', 'heart_rate'].includes(this.type);
        },
        min: [0, 'Value cannot be negative for this record type.'],
    },
    unit: {
        type: String, // e.g., "mmHg", "mg/dL", "mmol/L", "kg", "lbs", "bpm", "steps"
        trim: true,
        maxlength: [20, 'Unit cannot be more than 20 characters'],
        // Required if 'value' is expected and is a number, but not for object-based types like BP
        required: function() {
            return this.value !== undefined && this.value !== null;
        }
    },
    // For 'blood_pressure' type, use specific fields to ensure clarity
    systolic: {
        type: Number,
        min: [0, 'Systolic value cannot be negative'],
        required: function() {
            return this.type === 'blood_pressure';
        },
    },
    diastolic: {
        type: Number,
        min: [0, 'Diastolic value cannot be negative'],
        required: function() {
            return this.type === 'blood_pressure';
        },
    },
    // Common notes field for all record types
    notes: {
        type: String,
        maxlength: [1000, 'Notes cannot be more than 1000 characters'],
        default: '',
    },
    // Timestamp of when the record was actually taken/measured
    recordedAt: {
        type: Date,
        default: Date.now,
        required: [true, 'Please provide the recorded date and time.'],
    },
    // When the record was created in the database
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Add custom validation to ensure data consistency based on 'type'
HealthRecordSchema.pre('validate', function(next) {
    if (this.type === 'blood_pressure') {
        // Ensure that 'value' field is not used for blood pressure,
        // and systolic/diastolic are provided.
        if (this.value !== undefined && this.value !== null) {
            this.invalidate('value', `Value field should not be used for 'blood_pressure' type. Use 'systolic' and 'diastolic' instead.`, this.value);
        }
    } else if (['glucose', 'weight', 'heart_rate'].includes(this.type)) {
        // Ensure that 'systolic' and 'diastolic' are not used for these types,
        // and 'value' is provided.
        if (this.systolic !== undefined && this.systolic !== null) {
            this.invalidate('systolic', `'systolic' field should not be used for '${this.type}' type. Use 'value' instead.`, this.systolic);
        }
        if (this.diastolic !== undefined && this.diastolic !== null) {
            this.invalidate('diastolic', `'diastolic' field should not be used for '${this.type}' type. Use 'value' instead.`, this.diastolic);
        }
    } else if (['symptom_log', 'activity', 'food_intake', 'sleep', 'other'].includes(this.type)) {
        // For types that might only have notes or a free-form 'value' (if Mixed was kept)
        // Ensure that numerical value fields are not required or strictly used here
        if (this.value !== undefined && this.value !== null) {
             // If 'value' is intended for a non-numeric, free-form type, you'd need to adjust 'type: Number' for 'value'
             // For now, if value is present for these, it must be a Number based on schema
             // Consider removing 'value' and using only 'notes' or a separate 'details' Mixed field for these types
        }
    }
    next();
});

// Index to quickly query health records by patient and type, and then by time
HealthRecordSchema.index({ patientId: 1, type: 1, recordedAt: -1 });

module.exports = mongoose.model('HealthRecord', HealthRecordSchema);