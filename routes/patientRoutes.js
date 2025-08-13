// routes/patientRoutes.js
const express = require('express');
const {
  createPatientProfile,
  getPatientProfiles,
  getPatientProfile,
  updatePatientProfile,
  deletePatientProfile,
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Routes that don't require an ID in the URL
router.route('/')
  .post(protect, createPatientProfile) // Only authenticated users can create
  .get(protect, getPatientProfiles); // Only authenticated users can get their patient profiles

// Routes that require a specific patient ID
router.route('/:id')
  .get(protect, getPatientProfile) // Get a specific patient profile
  .put(protect, updatePatientProfile) // Update a specific patient profile
  .delete(protect, deletePatientProfile); // Delete a specific patient profile

module.exports = router;