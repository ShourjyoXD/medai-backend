// routes/medicationRoutes.js
const express = require('express');
const {
  addMedication,
  getMedicationsForPatient,
  getMedication,
  updateMedication,
  deleteMedication,
} = require('../controllers/medicationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// We merge params from the parent router (patientRoutes) to get patientId
const router = express.Router({ mergeParams: true });

// Route for adding a medication to a specific patient and getting all medications for that patient
router.route('/')
  .post(protect, addMedication)
  .get(protect, getMedicationsForPatient);

// Routes for specific medications (by medication ID)
router.route('/:id')
  .get(protect, getMedication)
  .put(protect, updateMedication)
  .delete(protect, deleteMedication);

module.exports = router;