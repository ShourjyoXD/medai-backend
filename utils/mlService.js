// medai-backend/utils/mlService.js
const axios = require('axios');

// Replace with the actual URL of your ML service
// Ensure Flask app is running on this port (e.g., 5001)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/**
 * Sends data to the ML service for prediction.
 * @param {Object} data - The data payload to send to the ML service (e.g., { features: [value] }).
 * @param {string} endpoint - The specific endpoint on the ML service (e.g., '/predict').
 * @returns {Promise<Object>} - The prediction result from the ML service.
 */
exports.callMlService = async (data, endpoint = '/predict') => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}${endpoint}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data; // This will contain the 'prediction' object from Flask
  } catch (error) {
    console.error(`Error calling ML service at ${ML_SERVICE_URL}${endpoint}:`, error.message);
    // Log more details if it's an Axios error with a response
    if (error.response) {
      console.error('ML service response status:', error.response.status);
      console.error('ML service response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from ML service:', error.request);
    }
    throw new Error('Failed to get prediction from ML service');
  }
};