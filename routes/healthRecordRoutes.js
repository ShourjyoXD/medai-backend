// routes/healthRecordRoutes.js
const express = require('express');
const {
  createHealthRecord,
  getHealthRecordsForPatient,
  getHealthRecordsByTypeForPatient,
  getHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
} = require('../controllers/healthRecordController');
const { protect } = require('../middleware/authMiddleware'); // Assuming 'authorize' is not strictly needed for all health records yet

// We merge params from the parent router (patientRoutes) to get patientId
const router = express.Router({ mergeParams: true });

// Routes for adding and getting all health records for a specific patient
router.route('/')
  .post(protect, createHealthRecord)
  .get(protect, getHealthRecordsForPatient);

// Route for getting health records of a specific type for a patient
router.route('/type/:type')
  .get(protect, getHealthRecordsByTypeForPatient);

// Routes for specific health records (by health record ID)
// These routes do NOT require patientId in the URL if accessed directly via /api/healthrecords/:id
router.route('/:id')
  .get(protect, getHealthRecord)
  .put(protect, updateHealthRecord)
  .delete(protect, deleteHealthRecord);

module.exports = router;