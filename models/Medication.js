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
        // Custom validation to ensure endDate is not before startDate if both are present
        validate: {
            validator: function (value) {
                return !this.startDate || !value || value >= this.startDate;
            },
            message: 'End date cannot be before start date',
        },
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

// --- NEW: Mongoose Hooks for PatientProfile Integration ---

// Static method to update the patient's currentMedications array
MedicationSchema.statics.updatePatientMedications = async function(patientId, medicationId, action) {
    try {
        const PatientProfile = this.model('PatientProfile'); // Get PatientProfile model
        const patient = await PatientProfile.findById(patientId);

        if (!patient) {
            console.error(`PatientProfile with ID ${patientId} not found for medication update.`);
            return;
        }

        if (action === 'add') {
            // Add medication ID if not already present
            if (!patient.currentMedications.includes(medicationId)) {
                patient.currentMedications.push(medicationId);
            }
        } else if (action === 'remove') {
            // Remove medication ID
            patient.currentMedications = patient.currentMedications.filter(
                (med) => med.toString() !== medicationId.toString()
            );
        }
        await patient.save();
    } catch (err) {
        // Log the error for debugging purposes
        console.error(`Error updating patient's medications in PatientProfile: ${err.message}`);
    }
};

// POST-SAVE hook: Add medication ID to patient's currentMedications array
MedicationSchema.post('save', async function() {
    // 'this' refers to the saved medication document
    await this.constructor.updatePatientMedications(this.patientId, this._id, 'add');
});

// PRE-DELETE ONE hook: Remove medication ID from patient's currentMedications array
MedicationSchema.pre('deleteOne', { document: true, query: false }, async function() {
    // 'this' refers to the medication document about to be deleted
    await this.constructor.updatePatientMedications(this.patientId, this._id, 'remove');
});

module.exports = mongoose.model('Medication', MedicationSchema);