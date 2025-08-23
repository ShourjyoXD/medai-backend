const axios = require('axios');

// It's good practice to use environment variables for service URLs
const FLASK_ML_SERVICE_URL = process.env.FLASK_ML_SERVICE_URL || 'https://medai-ml.onrender.com';

/**
 * Sends patient data to the Flask ML service to predict CVD risk.
 * @param {object} patientData An object containing all required features for prediction.
 * Expected format: {
 * age: number,
 * gender: number (0 for male, 1 for female),
 * height: number (cm),
 * weight: number (kg),
 * ap_hi: number (systolic BP),
 * ap_lo: number (diastolic BP),
 * cholesterol: number (1: normal, 2: above normal, 3: high),
 * gluc: number (1: normal, 2: above normal, 3: high),
 * smoke: number (0: no, 1: yes),
 * alco: number (0: no, 1: yes),
 * active: number (0: no, 1: yes)
 * }
 * @returns {Promise<object>} A promise that resolves to the prediction result or an error.
 */
async function predictCvdRisk(patientData) { // Renamed function for clarity
    try {
        // Log the data being sent for debugging
        console.log('Sending data to Flask ML service:', patientData);

        const response = await axios.post(`${FLASK_ML_SERVICE_URL}/predict_risk`, patientData); // Use /predict_risk

        console.log('Received response from Flask ML service:', response.data);
        return response.data; // This will contain prediction_class, probabilities, send_alert
    } catch (error) {
        console.error('Error calling Flask ML service:', error.message);
        // More detailed error logging for Axios errors
        if (error.response) {
            console.error('Flask ML service responded with status:', error.response.status);
            console.error('Flask ML service error data:', error.response.data);
            return {
                error: `ML service error: ${error.response.data.error || 'Unknown error'}`,
                status: error.response.status
            };
        } else if (error.request) {
            console.error('No response received from Flask ML service:', error.request);
            return { error: 'ML service is unreachable' };
        } else {
            console.error('Error setting up request to Flask ML service:', error.message);
            return { error: 'Error processing ML request' };
        }
    }
}

module.exports = {
    predictCvdRisk
};